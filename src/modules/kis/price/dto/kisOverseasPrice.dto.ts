export interface KisOverseasMultiPriceItem {
  excd: string; // 거래소코드 (NAS/NYS)
  symb: string; // 종목코드
  knam: string; // 종목명(로그용)
  last: string; // 현재가
  rate: string; // 등락율
  tvol: string; // 거래량
}

export interface KisOverseasMultiPriceResponse {
  rt_cd: string; // 0: 성공
  msg1: string; // 응답메세지
  output2: KisOverseasMultiPriceItem[];
}
