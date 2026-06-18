// 키: 유저별·종목별 최신 시세 (토큰 키 kis:token:{userId} 와 동일 컨벤션)
export const quoteCacheKey = (userId: string, stockId: number) => `quote:${userId}:${stockId}`;

// TTL: 폴링 주기(30초)의 2배. 한 사이클 놓쳐도 캐시가 살아있게.
export const QUOTE_CACHE_TTL_SEC = 60;

// 캐시에 저장하는 시세 스냅샷.
export interface CachedQuote {
  price: number; // 현재가 (현지 가격)
  priceKrw: number | null; // 원화 환산 가격
  volume: number; // 거래량
  change: number; // 등락률 (% 기호 없는 순수 실수)
  capturedAt: string; // 수집 시각 (ISO)

  fluctuationRateMap?: {
    DAILY?: number;
    M15?: number;
    M30?: number;
  };
}
