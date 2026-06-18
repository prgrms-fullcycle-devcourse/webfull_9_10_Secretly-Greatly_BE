export const STOCK_QUOTES_SUCCESS_RESPONSE = {
  statusCode: 200,
  timestamp: "2026-06-02T14:21:40.104Z",
  path: "/api/stocks/quotes",
  message: "요청한 종목의 시세 조회가 완료되었습니다.",
  data: {
    quotes: [
      {
        stockId: 1,
        price: 390.33, // native (미장 USD)
        priceKrw: 527000, // 원화 환산가(t_xprc)
        volume: 21520000,
        changeRate: { daily: -1.53, m15: 0.2, m30: -0.45 },
      },
      {
        stockId: 2,
        price: 73500, // 국장 KRW
        priceKrw: 73500, // 국장은 price 와 동일
        volume: 12450000,
        changeRate: { daily: 0.82, m15: -0.1, m30: null }, // 30분 데이터 없으면 null
      },
    ],
  },
  error: null,
};

export const STOCK_QUOTES_SUCCESS_API_RESPONSE = {
  status: 200,
  description: "종목 시세(현재가/원화환산/거래량/등락률) 조회 성공",
  schema: { example: STOCK_QUOTES_SUCCESS_RESPONSE },
};
