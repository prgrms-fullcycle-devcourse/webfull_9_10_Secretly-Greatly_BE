export const STOCK_ITEM_FETCH_ALL_API_DESCRIPTION = `
전체 종목의 채팅 로그를 최신순으로 조회합니다.

- 특정 종목방에 종속되지 않는 통합 타임라인 조회
- 최신 생성 순 정렬
- 블라인드 처리된 메시지(isHidden = true) 제외
- formattedLog 문자열 포함
`;

export const STOCK_ITEM_FETCH_ALL_API_RESPONSE = {
  status: 200,
  description: "전체 종목 통합 채팅 조회 성공",
  schema: {
    example: {
      statusCode: 200,
      timestamp: "2026-06-12T15:00:00.000Z",
      path: "/api/chats/all",
      message: "요청이 성공적으로 처리되었습니다.",
      data: {
        searchScope: "GLOBAL_TIMELINE",
        totalFetched: 3,
        logs: [
          {
            chatId: 98450,
            ticker: "KRW-BTC",
            senderType: "OTHER",
            maskedNickname: "user_q3p1",
            message: "비트코인 1억 재탈환 가나요??",
            formattedLog: "[12:46:55] [DEBUG] [KRW-BTC] user_q3p1: 비트코인 1억 재탈환 가나요??",
            createdAt: "2026-06-04T12:46:55.000Z",
          },
          {
            chatId: 98448,
            ticker: "NVDA",
            senderType: "OTHER",
            maskedNickname: "user_x9a2",
            message: "엔비디아 지지선 돌파 완료",
            formattedLog: "[12:46:40] [DEBUG] [NVDA] user_x9a2: 엔비디아 지지선 돌파 완료",
            createdAt: "2026-06-04T12:46:40.000Z",
          },
          {
            chatId: 98445,
            ticker: "005930",
            senderType: "MY_LOG",
            maskedNickname: "춘식이에요",
            message: "삼전 오늘 물타기 타이밍인 듯",
            formattedLog: "[12:46:10] [DEBUG] [005930] 춘식이에요: 삼전 오늘 물타기 타이밍인 듯",
            createdAt: "2026-06-04T12:46:10.000Z",
          },
        ],
      },
      error: null,
    },
  },
};
