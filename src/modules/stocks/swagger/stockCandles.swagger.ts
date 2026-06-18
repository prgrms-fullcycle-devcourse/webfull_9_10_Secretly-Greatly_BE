import { ApiQueryOptions, ApiResponseOptions } from "@nestjs/swagger";

export const STOCK_CANDLES_API_DESCRIPTION = "KIS 과거 시세 API를 호출해 FE 차트용 캔들 데이터를 조회합니다.";

export const STOCK_CANDLES_INTERVAL_QUERY: ApiQueryOptions = {
  name: "interval",
  required: false,
  enum: ["1d", "1wk", "1mo"],
  example: "1d",
  description: "캔들 간격 (1d: 일봉, 1wk: 주봉, 1mo: 월봉)",
};

export const STOCK_CANDLES_LIMIT_QUERY: ApiQueryOptions = {
  name: "limit",
  required: false,
  type: Number,
  example: 250,
  description: "조회할 캔들 개수",
};

export const STOCK_CANDLES_SUCCESS_API_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: "종목 캔들 차트 조회 성공",
  schema: {
    example: {
      candles: [
        {
          time: 1778025600,
          open: 254000,
          high: 270000,
          low: 251000,
          close: 260000,
          volume: 53097996,
        },
      ],
    },
  },
};
