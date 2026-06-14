export const STOCK_ITEM_FETCH_ALL_API_DESCRIPTION =
  "종목 추가/검색 화면용. 시스템에 등록된 전체 종목 목록을 정렬·필터링하여 반환합니다. " +
  "시세(price/change/volume)는 요청 유저 기준 최신값이며, 유저가 아직 수집하지 않은 종목은 null으로 채워질 수 있습니다.";

// ── 200 성공 ────────────────────────────────────────────────────────
export const STOCK_ITEM_FETCH_ALL_SUCCESS_RESPONSE = {
  statusCode: 200,
  timestamp: "2026-06-02T14:21:40.104Z",
  path: "/api/stocks",
  message: "조건에 부합하는 전체 종목 데이터 조회가 완료되었습니다.",
  data: {
    sortedBy: "change",
    totalCount: 3,
    items: [
      {
        stockId: 33,
        code: "NVDA",
        name: "NVIDIA",
        price: 920.11,
        change: 4.25,
        volume: 4219500,
        market: "OVERSEAS",
      },
      {
        stockId: 1,
        code: "005930",
        name: "삼성전자",
        price: 73500,
        change: -0.85,
        volume: 12450000,
        market: "DOMESTIC",
      },
      {
        stockId: 51,
        code: "KRW-BTC",
        name: "비트코인",
        price: 98500000,
        change: 1.14,
        volume: 8540,
        market: "COIN",
      },
    ],
  },
  error: null,
};

export const STOCK_ITEM_FETCH_ALL_SUCCESS_API_RESPONSE = {
  status: 200,
  description: "조건별 전체 종목 목록 조회 성공",
  schema: {
    example: STOCK_ITEM_FETCH_ALL_SUCCESS_RESPONSE,
  },
};

// ── 400 유효성 실패 ─────────────────────────────────────────────────
export const STOCK_ITEM_FETCH_ALL_VALIDATION_RESPONSE = {
  statusCode: 400,
  timestamp: "2026-06-02T14:21:45.317Z",
  path: "/api/stocks",
  message: "sort 파라미터는 'change', 'price', 'volume' 중 하나여야 합니다.",
  error: "ValidationException",
  data: null,
};

export const STOCK_ITEM_FETCH_ALL_VALIDATION_API_RESPONSE = {
  status: 400,
  description: "잘못된 Query Parameter (sort/order/market 허용값 외 등)",
  schema: {
    example: STOCK_ITEM_FETCH_ALL_VALIDATION_RESPONSE,
  },
};

// ── 401 인증 실패 ───────────────────────────────────────────────────
export const STOCK_ITEM_FETCH_ALL_UNAUTHORIZED_RESPONSE = {
  statusCode: 401,
  timestamp: "2026-06-02T14:21:45.317Z",
  path: "/api/stocks",
  message: "인증이 필요합니다.",
  error: "UnauthorizedException",
  data: null,
};

export const STOCK_ITEM_FETCH_ALL_UNAUTHORIZED_API_RESPONSE = {
  status: 401,
  description: "쿠키 JWT 없음/만료/위조",
  schema: {
    example: STOCK_ITEM_FETCH_ALL_UNAUTHORIZED_RESPONSE,
  },
};
