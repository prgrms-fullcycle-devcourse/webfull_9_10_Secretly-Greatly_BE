import { Market } from "@prisma/client";

// DB Enum(KR/US/CRYPTO) -> API 응답 Enum(DOMESTIC/OVERSEAS/COIN)
export const MARKET_TO_RESPONSE: Record<Market, string> = {
  KR: "DOMESTIC",
  US: "OVERSEAS",
  CRYPTO: "COIN",
};

// API 요청 필터(DOMESTIC/OVERSEAS/COIN) -> DB Enum(KR/US/CRYPTO)
export const RESPONSE_TO_MARKET: Record<string, Market> = {
  DOMESTIC: "KR",
  OVERSEAS: "US",
  COIN: "CRYPTO",
};
