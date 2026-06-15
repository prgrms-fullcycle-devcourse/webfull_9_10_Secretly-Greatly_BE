-- ============================================================================
--  마이그레이션: 거래소 타임존 기반 거래일(trade_date) 전략 적용
-- ============================================================================
--
--  [마이그레이션 목적]
--   주식 시세를 틱 → 분봉 → 일봉으로 집계할 때, 일봉의 "하루 경계"를 각 종목
--   거래소의 현지 타임존으로 잡기 위한 구조 변경.
--     - 국장(KRX)   → Asia/Seoul 기준 거래일
--     - 미장(NASDAQ) → America/New_York 기준 거래일
--
--  [핵심 원칙]
--   (1) 타임존 변환은 '분봉 → 일봉' 롤업 한 곳에서만. 틱·분봉은 UTC 그대로.
--   (2) 일봉 시간 컬럼은 timestamptz 가 아니라 date(trade_date).
--   (3) 파티션 경계(틱=일, 분봉=월)는 KST 로 통일(물리 저장 위치일 뿐).
--
--  [전제] stocks 및 그 하위(ticks/minute_bars/daily_bars)가 모두 비어있음.
--         → exchange_timezone 백필 불필요(바로 NOT NULL 추가).
--         → daily_bars 통째 재생성에 따른 데이터 손실 없음.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. ExchangeTimezone enum 타입
--    라벨 자체가 IANA 식별자. AT TIME ZONE 에는 ::text 로 넘긴다.
--    (국장/미장만 운영하는 현재 전제라 값 2개. 거래소가 늘면 값 추가)
-- ----------------------------------------------------------------------------
CREATE TYPE "ExchangeTimezone" AS ENUM ('Asia/Seoul', 'America/New_York');


-- ----------------------------------------------------------------------------
-- 1. stocks.exchange_timezone (enum) 컬럼 추가
--    stocks 가 비어있으므로 채울 기존 행이 없다 → 바로 NOT NULL 로 추가 가능.
--    이후 종목을 INSERT 할 때 거래소에 맞는 타임존을 애플리케이션에서 넣는다
--    (KRX→Asia/Seoul, NASDAQ/NYSE→America/New_York).
-- ----------------------------------------------------------------------------
ALTER TABLE "stocks" ADD COLUMN "exchange_timezone" "ExchangeTimezone" NOT NULL;


-- ----------------------------------------------------------------------------
-- 2. daily_bars 재생성: captured_at(timestamptz) → trade_date(date), 연 파티션
--    파티션 키 컬럼은 ALTER/DROP COLUMN 불가하므로 통째로 재생성한다.
--    (비어있으므로 손실 없음)
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS "daily_bars_user_stock_ts";
ALTER TABLE "daily_bars" DROP CONSTRAINT IF EXISTS "daily_bars_stock_id_fkey";
ALTER TABLE "daily_bars" DROP CONSTRAINT IF EXISTS "daily_bars_user_id_fkey";
DROP TABLE IF EXISTS "daily_bars" CASCADE;

CREATE TABLE "daily_bars" (
  "user_id"    uuid NOT NULL REFERENCES "users"("id")  ON DELETE CASCADE ON UPDATE CASCADE,
  "stock_id"   int  NOT NULL REFERENCES "stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "trade_date" date NOT NULL, -- 거래소 현지 '거래일'
  "open"  numeric(18,4) NOT NULL,
  "high"  numeric(18,4) NOT NULL,
  "low"   numeric(18,4) NOT NULL,
  "close" numeric(18,4) NOT NULL,
  "volume" bigint,
  CONSTRAINT "daily_bars_pkey" PRIMARY KEY ("user_id", "stock_id", "trade_date")
) PARTITION BY RANGE ("trade_date");

CREATE INDEX "daily_bars_user_stock_td"
  ON "daily_bars" ("user_id", "stock_id", "trade_date" DESC);

-- RLS 재적용
ALTER TABLE "daily_bars" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_bars" FORCE ROW LEVEL SECURITY;
CREATE POLICY "daily_bars_isolation" ON "daily_bars"
  USING ("user_id" = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK ("user_id" = current_setting('app.current_user_id', true)::uuid);


-- ----------------------------------------------------------------------------
-- 3. 파티션 생성 헬퍼 — 경계를 KST(Asia/Seoul)로 고정
--    공통 패턴: 날짜::timestamp AT TIME ZONE 'Asia/Seoul'
--      = "그 날짜의 한국 자정"을 정확한 UTC 시점으로 변환(세션 TZ 무관).
-- ----------------------------------------------------------------------------

-- 일 파티션 (ticks)
CREATE OR REPLACE FUNCTION create_daily_partition(p_parent text, p_day date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  part_name text := format('%s_%s', p_parent, to_char(p_day,'YYYY_MM_DD')); -- 테이블 이름 예시: ticks_2026_01_15
  lo timestamptz := p_day::timestamp       AT TIME ZONE 'Asia/Seoul';
  hi timestamptz := (p_day + 1)::timestamp AT TIME ZONE 'Asia/Seoul';
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    part_name, p_parent, lo, hi);
END $$;

-- 월 파티션 (minute_bars)
CREATE OR REPLACE FUNCTION create_monthly_partition(p_parent text, p_month date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  m_start date := date_trunc('month', p_month)::date;
  part_name text := format('%s_%s', p_parent, to_char(m_start,'YYYY_MM'));
  lo timestamptz := m_start::timestamp AT TIME ZONE 'Asia/Seoul';
  hi timestamptz := (m_start + interval '1 month')::date::timestamp AT TIME ZONE 'Asia/Seoul';
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    part_name, p_parent, lo, hi);
END $$;

-- 연 파티션 (daily_bars) — trade_date 가 date 라 date 경계, TZ 변환 불필요
CREATE OR REPLACE FUNCTION create_yearly_partition(p_parent text, p_year date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  y_start date := date_trunc('year', p_year)::date;
  part_name text := format('%s_%s', p_parent, to_char(y_start,'YYYY'));
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    part_name, p_parent, y_start, (y_start + interval '1 year')::date);
END $$;


-- ----------------------------------------------------------------------------
-- 4. 미래 파티션 보장 (틱=일, 분봉=월, 일봉=연)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ensure_future_partitions()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE d date;
BEGIN
  FOR d IN SELECT generate_series(current_date, current_date + 3, '1 day')::date LOOP
    PERFORM create_daily_partition('ticks', d);
  END LOOP;
  PERFORM create_monthly_partition('minute_bars', current_date);
  PERFORM create_monthly_partition('minute_bars', (current_date + interval '1 month')::date);
  PERFORM create_yearly_partition('daily_bars', current_date);
  PERFORM create_yearly_partition('daily_bars', (current_date + interval '1 year')::date);
END $$;


-- ----------------------------------------------------------------------------
-- 5. 롤업: 분봉 → 일봉 (거래소 타임존으로 trade_date 확정. ★ 유일한 TZ 변환 지점)
--    enum 컬럼은 AT TIME ZONE 에 직접 못 들어가므로 ::text 캐스팅.
--    멱등: ON CONFLICT DO UPDATE 라 같은 구간 재실행해도 결과 동일.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rollup_minute_to_daily(p_from timestamptz, p_to timestamptz)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO daily_bars (user_id, stock_id, trade_date, open, high, low, close, volume)
  SELECT
    m.user_id,
    m.stock_id,
    (m.captured_at AT TIME ZONE s.exchange_timezone::text)::date,   -- 거래소 현지 거래일
    (array_agg(m.open  ORDER BY m.captured_at ASC))[1],              -- 시가(첫 분봉)
    max(m.high),                                                     -- 고가
    min(m.low),                                                      -- 저가
    (array_agg(m.close ORDER BY m.captured_at DESC))[1],             -- 종가(마지막 분봉)
    sum(m.volume)                                                    -- 거래량 합
  FROM minute_bars m
  JOIN stocks s ON s.id = m.stock_id
  WHERE m.captured_at >= p_from AND m.captured_at < p_to
  -- GROUP BY: (유저 + 종목 + 거래일)이 같은 데이터를 하나로 묶음. 예) "유저A key로 모은 시세 정보 중, 삼성전자의 1월 15일 거래일"
  -- AT TIME ZONE: 분봉의 시점(m.captured_at, UTC)을 거래소 현지 시간(s.exchange_timezone::text)으로 변환
  GROUP BY m.user_id, m.stock_id, (m.captured_at AT TIME ZONE s.exchange_timezone::text)::date
  ON CONFLICT (user_id, stock_id, trade_date) DO UPDATE
    SET open=EXCLUDED.open, high=EXCLUDED.high, low=EXCLUDED.low,
        close=EXCLUDED.close, volume=EXCLUDED.volume;
END $$;
-- 참고: 틱 → 분봉 롤업(rollup_tick_to_minute)은 변경 없음(분 절단은 TZ 무관).


-- ----------------------------------------------------------------------------
-- 6. 적용 직후 파티션 1회 보장
-- ----------------------------------------------------------------------------
SELECT ensure_future_partitions();