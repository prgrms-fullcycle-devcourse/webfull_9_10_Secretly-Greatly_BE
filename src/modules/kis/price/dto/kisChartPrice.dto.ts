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
