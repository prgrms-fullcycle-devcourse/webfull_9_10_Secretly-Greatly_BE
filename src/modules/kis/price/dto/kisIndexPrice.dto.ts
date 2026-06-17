// ── 국내업종 현재지수 (FHPUP02100000) ────────────────────────────────
//   output: 단건 현재 지수
export interface KisDomesticIndexOutput {
  bstp_nmix_prpr: string; // 업종 지수 현재가
  bstp_nmix_prdy_vrss: string; // 전일 대비
  bstp_nmix_prdy_ctrt: string; // 전일 대비율(등락률 %)
  acml_vol: string; // 누적 거래량
}
export interface KisDomesticIndexResponse {
  rt_cd: string; // 0: 성공
  msg1: string;
  output: KisDomesticIndexOutput;
}

// ── 해외지수분봉조회 (FHKST03030200) ─────────────────────────────────
//   output1: 현재값 요약 (분봉 배열은 output2 — 현재값만 쓸 거라 미사용)
export interface KisOverseasIndexOutput1 {
  ovrs_nmix_prpr: string; // 현재가(지수/환율)
  ovrs_nmix_prdy_vrss: string; // 전일 대비
  prdy_ctrt: string; // 전일 대비율(등락률 %)
  ovrs_nmix_prdy_clpr: string; // 전일 종가
}
export interface KisOverseasIndexResponse {
  rt_cd: string;
  msg1: string;
  output1: KisOverseasIndexOutput1;
}

// ── 공통: 수집 결과 (적재/캐시에 쓰는 정규화 형태) ────────────────────
export interface IndexQuote {
  code: string; // KOSPI / NASDAQ / USDKRW ...
  value: number; // 지수값 / 환율
  change: number; // 등락률
  capturedAt: Date;
}
