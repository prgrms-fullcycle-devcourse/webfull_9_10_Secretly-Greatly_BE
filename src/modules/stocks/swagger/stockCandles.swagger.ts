import { ApiQueryOptions, ApiResponseOptions } from "@nestjs/swagger";

export const STOCK_CANDLES_API_DESCRIPTION = "KIS 1분봉 시세 데이터를 조회해 FE 차트용 캔들 데이터를 제공합니다.";

export const STOCK_CANDLES_LIMIT_QUERY: ApiQueryOptions = {
  name: "limit",
  required: false,
  type: Number,
  example: 250,
  description: "조회할 1분봉 캔들 개수",
};

export const STOCK_CANDLES_SUCCESS_API_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: "종목 1분봉 캔들 차트 조회 성공",
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
