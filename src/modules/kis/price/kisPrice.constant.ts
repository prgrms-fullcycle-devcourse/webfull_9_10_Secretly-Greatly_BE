// ── 국내주식 멀티종목 시세조회 (FHKST11300006) ──────────────────────
export const KIS_DOMESTIC_MULTI_PRICE = {
  PATH: "/uapi/domestic-stock/v1/quotations/intstock-multprice",
  TR_ID: "FHKST11300006",
  MAX_SYMBOLS_PER_CALL: 30,
} as const;

// ── 해외주식 복수종목 시세조회 (HHDFS76220000) ──────────────────────
export const KIS_OVERSEAS_MULTI_PRICE = {
  PATH: "/uapi/overseas-price/v1/quotations/multprice",
  TR_ID: "HHDFS76220000",
  MAX_SYMBOLS_PER_CALL: 10,
} as const;

// ── 거래소(Exchange enum) → KIS 거래소코드(EXCD) 매핑 ───────────────
// 단일 소스. 정규장 기준. 주간거래(BAY/BAQ/BAA)는 사용하지 않음.
export const EXCHANGE_TO_EXCD = {
  NASDAQ: "NAS",
  NYSE: "NYS",
  // AMEX: "AMS",
} as const;

// KIS EXCD → Exchange enum 역매핑
export const EXCD_TO_EXCHANGE: Record<string, string> = Object.fromEntries(
  Object.entries(EXCHANGE_TO_EXCD).map(([exchange, excd]) => [excd, exchange]),
);

// 청크 호출 간 간격 (Rate Limit 마진, ms)
export const CHUNK_INTERVAL_MS = 150;
