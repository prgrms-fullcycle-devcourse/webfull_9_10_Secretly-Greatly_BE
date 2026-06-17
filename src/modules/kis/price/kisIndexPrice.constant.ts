// 해외/국내 지수·환율 1분 폴링용 상수

// ── API 1: 국내업종 현재지수 (코스피/코스닥) ──────────────────────────
//   국내주식-063, 단건 현재지수
export const KIS_DOMESTIC_INDEX = {
  PATH: "/uapi/domestic-stock/v1/quotations/inquire-index-price",
  TR_ID: "FHPUP02100000",
  MRKT_DIV: "U", // 업종
} as const;

// ── API 2: 해외지수분봉조회 (나스닥/나스닥100/S&P500/환율) ─────────────
//   해외주식-031, 분봉(현재값 포함)
export const KIS_OVERSEAS_INDEX = {
  PATH: "/uapi/overseas-price/v1/quotations/inquire-time-indexchartprice",
  TR_ID: "FHKST03030200",
} as const;

// FID_COND_MRKT_DIV_CODE 값
export const OVERSEAS_MRKT_DIV = {
  INDEX: "N", // 해외지수
  FX: "X", // 환율
} as const;

/**
 * 수집 대상 지표 정의.
 *  - source: 어느 API 로 받는지 (DOMESTIC=국내업종지수, OVERSEAS=해외지수분봉)
 *  - mrktDiv: 해외인 경우 N(지수)/X(환율), 국내인 경우 U
 *  - inputCode: FID_INPUT_ISCD 값
 */
export interface IndexDef {
  code: string; // 우리 내부 식별 코드 (캐시 키/DB code)
  name: string;
  source: "DOMESTIC" | "OVERSEAS";
  mrktDiv: string; // U / N / X
  inputCode: string; // FID_INPUT_ISCD
}

export const TRACKED_INDICES: IndexDef[] = [
  { code: "KOSPI", name: "코스피", source: "DOMESTIC", mrktDiv: "U", inputCode: "0001" },
  { code: "KOSDAQ", name: "코스닥", source: "DOMESTIC", mrktDiv: "U", inputCode: "1001" },
  { code: "NASDAQ", name: "나스닥 종합", source: "OVERSEAS", mrktDiv: "N", inputCode: "COMP" },
  { code: "NASDAQ100", name: "나스닥 100", source: "OVERSEAS", mrktDiv: "N", inputCode: "NDX" },
  { code: "SP500", name: "S&P 500", source: "OVERSEAS", mrktDiv: "N", inputCode: "SPX" },
  // 원/달러 환율 응답값이 0인 문제가 있어, 현 MVP에서는 우선 제외
  // { code: "USDKRW", name: "원/달러 환율", source: "OVERSEAS", mrktDiv: "X", inputCode: "XFX@KRW" },
];

// 해외지수분봉조회 공통 쿼리
export const OVERSEAS_INDEX_QUERY = {
  FID_HOUR_CLS_CODE: "0", // 0: 정규장 (시간외는 1)
  FID_PW_DATA_INCU_YN: "N", // 과거 데이터 미포함 (현재값만)
} as const;
