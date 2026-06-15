-- This is an empty migration.-- ============================================================================
--  마이그레이션: rollup_minute_to_daily 에 거래소 타임존 필터 추가
--  마이그레이션명 예: add_exchange_filter_to_daily_rollup
-- ============================================================================
--  [이유]
--   기존 2-인자 버전은 시간 구간만 받아, 그 구간에 걸린 '모든 거래소' 종목을
--   집계했다. 국장 롤업(rollupDailyKR)이 미장 종목까지 한국 거래일 경계로
--   잘못 집계하는 문제가 있다. 세 번째 인자 p_timezone 으로 해당 거래소
--   종목만 필터한다.
-- ----------------------------------------------------------------------------

-- 기존 2-인자 버전 제거 - 오버로드 혼동 방지
DROP FUNCTION IF EXISTS rollup_minute_to_daily(timestamptz, timestamptz);

-- 3-인자 버전: p_timezone 으로 거래소 필터 + 거래일 산정
CREATE OR REPLACE FUNCTION rollup_minute_to_daily(
  p_from timestamptz,
  p_to timestamptz,
  p_timezone text
)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO daily_bars (user_id, stock_id, trade_date, open, high, low, close, volume)
  SELECT
    m.user_id,
    m.stock_id,
    (m.captured_at AT TIME ZONE s.exchange_timezone::text)::date,   -- 거래소 현지 거래일
    (array_agg(m.open  ORDER BY m.captured_at ASC))[1],
    max(m.high),
    min(m.low),
    (array_agg(m.close ORDER BY m.captured_at DESC))[1],
    sum(m.volume)
  FROM minute_bars m
  JOIN stocks s ON s.id = m.stock_id
  WHERE m.captured_at >= p_from AND m.captured_at < p_to
    AND s.exchange_timezone = p_timezone::"ExchangeTimezone"   -- * 해당 거래소만 롤업
  GROUP BY m.user_id, m.stock_id, (m.captured_at AT TIME ZONE s.exchange_timezone::text)::date
  ON CONFLICT (user_id, stock_id, trade_date) DO UPDATE
    SET open=EXCLUDED.open, high=EXCLUDED.high, low=EXCLUDED.low,
        close=EXCLUDED.close, volume=EXCLUDED.volume;
END $$;
