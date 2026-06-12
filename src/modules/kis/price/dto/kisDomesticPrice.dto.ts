export interface KisDomesticMultiPriceItem {
  inter_shrn_iscd: string; // 종목코드
  inter_kor_isnm: string; // 종목명
  inter2_prpr: string; // 현재가
  inter2_oprc: string; // 시가
  inter2_hgpr: string; // 고가
  inter2_lwpr: string; // 저가
  acml_vol: string; // 누적 거래량
  inter2_prdy_clpr: string; // 전일 종가
  inter2_sdpr: string; // 기준가
  prdy_ctrt: string; // 전일 대비율(등락률)
}

export interface KisDomesticMultiPriceResponse {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output: KisDomesticMultiPriceItem[];
}
