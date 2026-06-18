export interface KisDomesticMinuteChartItem {
  stck_bsop_date: string; // 영업일자
  stck_cntg_hour: string; // 체결시각
  stck_oprc: string; // 시가
  stck_hgpr: string; // 고가
  stck_lwpr: string; // 저가
  stck_prpr: string; // 현재가(종가)
  cntg_vol?: string; // 거래량
}

export interface KisDomesticMinuteChartResponse {
  rt_cd: string;
  msg1: string;
  output2?: KisDomesticMinuteChartItem[];
}
export interface KisOverseasMinuteChartItem {
  xymd: string; // 날짜
  xhms: string; // 시간
  open: string;
  high: string;
  low: string;
  last: string;
  evol?: string;
}

export interface KisOverseasMinuteChartResponse {
  rt_cd: string;
  msg1: string;
  output2?: KisOverseasMinuteChartItem[];
}

export interface CandleDto {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface KisDomesticChartItem {
  stck_bsop_date: string;
  stck_oprc: string;
  stck_hgpr: string;
  stck_lwpr: string;
  stck_clpr: string;
  acml_vol: string;
}

export interface KisDomesticChartResponse {
  rt_cd: string;
  msg1: string;
  output2?: KisDomesticChartItem[];
}

export interface KisOverseasChartItem {
  xymd: string;
  open: string;
  high: string;
  low: string;
  clos: string;
  tvol: string;
}

export interface KisOverseasChartResponse {
  rt_cd: string;
  msg1: string;
  output2?: KisOverseasChartItem[];
}
