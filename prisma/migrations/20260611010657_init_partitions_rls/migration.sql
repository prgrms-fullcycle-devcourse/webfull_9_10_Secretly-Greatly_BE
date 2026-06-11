/*
  Warnings:

  - You are about to drop the `market_snapshots` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "market_snapshots" DROP CONSTRAINT "market_snapshots_stock_id_fkey";

-- DropTable
DROP TABLE "market_snapshots";

-- =====================================================================
--  여기서부터 수동 raw SQL: 파티션 테이블 + RLS + 함수 + 롤업 + 리텐션
--  (Prisma 자동 생성 CreateTable/Index/FK 는 아래로 대체)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 파티션 부모 테이블 (captured_at = timestamptz, RANGE 파티션)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticks (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stock_id    int  NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  captured_at timestamptz NOT NULL,
  price       numeric(18,4) NOT NULL,
  volume      bigint,
  PRIMARY KEY (user_id, stock_id, captured_at)
) PARTITION BY RANGE (captured_at);
CREATE INDEX IF NOT EXISTS ticks_user_stock_ts ON ticks (user_id, stock_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS minute_bars (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stock_id    int  NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  captured_at timestamptz NOT NULL,
  open  numeric(18,4) NOT NULL,
  high  numeric(18,4) NOT NULL,
  low   numeric(18,4) NOT NULL,
  close numeric(18,4) NOT NULL,
  volume bigint,
  PRIMARY KEY (user_id, stock_id, captured_at)
) PARTITION BY RANGE (captured_at);
CREATE INDEX IF NOT EXISTS minute_bars_user_stock_ts ON minute_bars (user_id, stock_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS daily_bars (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stock_id    int  NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  captured_at timestamptz NOT NULL,
  open  numeric(18,4) NOT NULL,
  high  numeric(18,4) NOT NULL,
  low   numeric(18,4) NOT NULL,
  close numeric(18,4) NOT NULL,
  volume bigint,
  PRIMARY KEY (user_id, stock_id, captured_at)
) PARTITION BY RANGE (captured_at);
CREATE INDEX IF NOT EXISTS daily_bars_user_stock_ts ON daily_bars (user_id, stock_id, captured_at DESC);

-- ---------------------------------------------------------------------
-- RLS — 시세 3종 유저별 격리. app_rw(BYPASSRLS 없는) 롤로 접속 전제.
--   트랜잭션에서 set_config('app.current_user_id', <uuid>, true) 선행 필요.
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ticks','minute_bars','daily_bars']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($f$
      CREATE POLICY %1$s_isolation ON %1$I
        USING (user_id = current_setting('app.current_user_id', true)::uuid)
        WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid)
    $f$, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 파티션 생성 헬퍼 (ticks=일, minute_bars=월, daily_bars=연)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_daily_partition(p_parent text, p_day date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE part_name text := format('%s_%s', p_parent, to_char(p_day,'YYYY_MM_DD'));
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    part_name, p_parent, p_day::timestamptz, (p_day+1)::timestamptz);
END $$;

CREATE OR REPLACE FUNCTION create_monthly_partition(p_parent text, p_month date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE m_start date := date_trunc('month', p_month)::date;
        part_name text := format('%s_%s', p_parent, to_char(m_start,'YYYY_MM'));
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    part_name, p_parent, m_start::timestamptz, (m_start+interval '1 month')::timestamptz);
END $$;

CREATE OR REPLACE FUNCTION create_yearly_partition(p_parent text, p_year date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE y_start date := date_trunc('year', p_year)::date;
        part_name text := format('%s_%s', p_parent, to_char(y_start,'YYYY'));
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    part_name, p_parent, y_start::timestamptz, (y_start+interval '1 year')::timestamptz);
END $$;

CREATE OR REPLACE FUNCTION ensure_future_partitions()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE d date;
BEGIN
  FOR d IN SELECT generate_series(current_date, current_date+3, '1 day')::date LOOP
    PERFORM create_daily_partition('ticks', d);
  END LOOP;
  PERFORM create_monthly_partition('minute_bars', current_date);
  PERFORM create_monthly_partition('minute_bars', (current_date+interval '1 month')::date);
  PERFORM create_yearly_partition('daily_bars', current_date);
  PERFORM create_yearly_partition('daily_bars', (current_date+interval '1 year')::date);
END $$;

-- ---------------------------------------------------------------------
-- 롤업 (틱→분봉, 분봉→일봉). UPSERT라 멱등.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rollup_tick_to_minute(p_from timestamptz, p_to timestamptz)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO minute_bars (user_id, stock_id, captured_at, open, high, low, close, volume)
  SELECT user_id, stock_id, date_trunc('minute', captured_at),
         (array_agg(price ORDER BY captured_at ASC))[1], max(price), min(price),
         (array_agg(price ORDER BY captured_at DESC))[1], sum(volume)
  FROM ticks WHERE captured_at >= p_from AND captured_at < p_to
  GROUP BY user_id, stock_id, date_trunc('minute', captured_at)
  ON CONFLICT (user_id, stock_id, captured_at) DO UPDATE
    SET open=EXCLUDED.open, high=EXCLUDED.high, low=EXCLUDED.low,
        close=EXCLUDED.close, volume=EXCLUDED.volume;
END $$;

CREATE OR REPLACE FUNCTION rollup_minute_to_daily(p_from timestamptz, p_to timestamptz)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO daily_bars (user_id, stock_id, captured_at, open, high, low, close, volume)
  SELECT user_id, stock_id, date_trunc('day', captured_at),
         (array_agg(open ORDER BY captured_at ASC))[1], max(high), min(low),
         (array_agg(close ORDER BY captured_at DESC))[1], sum(volume)
  FROM minute_bars WHERE captured_at >= p_from AND captured_at < p_to
  GROUP BY user_id, stock_id, date_trunc('day', captured_at)
  ON CONFLICT (user_id, stock_id, captured_at) DO UPDATE
    SET open=EXCLUDED.open, high=EXCLUDED.high, low=EXCLUDED.low,
        close=EXCLUDED.close, volume=EXCLUDED.volume;
END $$;

-- ---------------------------------------------------------------------
-- 리텐션 (만료 파티션 통째 DROP)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION drop_old_partitions(p_parent text, p_cutoff timestamptz)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record; upper_bound timestamptz;
BEGIN
  FOR r IN
    SELECT c.oid::regclass::text AS part_name, pg_get_expr(c.relpartbound, c.oid) AS bound
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_class parent ON parent.oid = i.inhparent
    WHERE parent.relname = p_parent
  LOOP
    upper_bound := (regexp_match(r.bound, 'TO \(''([^'']+)''\)'))[1]::timestamptz;
    IF upper_bound IS NOT NULL AND upper_bound <= p_cutoff THEN
      EXECUTE format('DROP TABLE IF EXISTS %s', r.part_name);
    END IF;
  END LOOP;
END $$;
