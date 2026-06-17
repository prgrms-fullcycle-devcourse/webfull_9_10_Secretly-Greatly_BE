-- This is an empty migration.-- ============================================================================
--  원화환산가(price_krw / close_krw) 추가를 롤업 함수에 반영
-- ============================================================================
--  미장 KIS 응답의 t_xprc(원환산당일가격)를 저장해 원화 기준 표시/차트를 지원.
--  1) 롤업 함수 재정의: close_krw 가 틱→분봉→일봉으로 전파되도록
--     - 분봉 close_krw = 그 분 마지막 틱의 price_krw
--     - 일봉 close_krw = 그날 마지막 분봉의 close_krw
-- ----------------------------------------------------------------------------

-- ── 1) 틱 → 분봉 롤업: close_krw 추가 ───────────────────────────────────────
CREATE OR REPLACE FUNCTION rollup_tick_to_minute(
  p_from timestamptz,
  p_to timestamptz
)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO minute_bars (user_id, stock_id, captured_at, open, high, low, close, close_krw, volume)
  SELECT
    t.user_id,
    t.stock_id,
    date_trunc('minute', t.captured_at)                              AS captured_at,
    (array_agg(t.price     ORDER BY t.captured_at ASC))[1]           AS open,
    max(t.price)                                                     AS high,
    min(t.price)                                                     AS low,
    (array_agg(t.price     ORDER BY t.captured_at DESC))[1]          AS close,
    (array_agg(t.price_krw ORDER BY t.captured_at DESC))[1]          AS close_krw,  -- ★ 마지막 틱의 원화환산가
    sum(t.volume)                                                    AS volume
  FROM ticks t
  WHERE t.captured_at >= p_from AND t.captured_at < p_to
  GROUP BY t.user_id, t.stock_id, date_trunc('minute', t.captured_at)
  ON CONFLICT (user_id, stock_id, captured_at) DO UPDATE
    SET open=EXCLUDED.open, high=EXCLUDED.high, low=EXCLUDED.low,
        close=EXCLUDED.close, close_krw=EXCLUDED.close_krw, volume=EXCLUDED.volume;
END $$;

-- ── 2) 분봉 → 일봉 롤업: close_krw 추가 (3-인자, 거래소 필터 유지) ─────────────
CREATE OR REPLACE FUNCTION rollup_minute_to_daily(
  p_from timestamptz,
  p_to timestamptz,
  p_timezone text
)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO daily_bars (user_id, stock_id, trade_date, open, high, low, close, close_krw, volume)
  SELECT
    m.user_id,
    m.stock_id,
    (m.captured_at AT TIME ZONE s.exchange_timezone::text)::date     AS trade_date,
    (array_agg(m.open      ORDER BY m.captured_at ASC))[1]           AS open,
    max(m.high)                                                      AS high,
    min(m.low)                                                       AS low,
    (array_agg(m.close     ORDER BY m.captured_at DESC))[1]          AS close,
    (array_agg(m.close_krw ORDER BY m.captured_at DESC))[1]          AS close_krw,
    sum(m.volume)                                                    AS volume
  FROM minute_bars m
  JOIN stocks s ON s.id = m.stock_id
  WHERE m.captured_at >= p_from AND m.captured_at < p_to
    AND s.exchange_timezone = p_timezone::"ExchangeTimezone"
  GROUP BY m.user_id, m.stock_id, (m.captured_at AT TIME ZONE s.exchange_timezone::text)::date
  ON CONFLICT (user_id, stock_id, trade_date) DO UPDATE
    SET open=EXCLUDED.open, high=EXCLUDED.high, low=EXCLUDED.low,
        close=EXCLUDED.close, close_krw=EXCLUDED.close_krw, volume=EXCLUDED.volume;
END $$;