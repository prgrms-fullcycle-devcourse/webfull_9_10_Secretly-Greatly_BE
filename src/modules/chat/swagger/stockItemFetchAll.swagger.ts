export const STOCK_ITEM_FETCH_ALL_API_DESCRIPTION = `
글로벌 채팅방(GLOBAL_CHAT)의 채팅 로그를 최신순으로 조회합니다.

- 메인 채팅 기능으로 사용되는 글로벌 채팅 조회
- 최신 생성 순 정렬
- 블라인드 처리된 메시지(isHidden = true) 제외
- formattedLog 문자열 포함
`;

export const STOCK_ITEM_FETCH_ALL_API_RESPONSE = {
  status: 200,
  description: "글로벌 채팅 조회 성공",
  schema: {
    example: {
      statusCode: 200,
      timestamp: "2026-06-15T10:55:41.282Z",
      path: "/api/chats/all",
      message: "요청이 성공적으로 처리되었습니다.",
      data: {
        searchScope: "GLOBAL_TIMELINE",
        totalFetched: 1,
        logs: [
          {
            chatId: 1,
            ticker: "GLOBAL",
            senderType: "MY_LOG",
            maskedNickname: "test_user",
            message: "안녕하세요",
            formattedLog: "[10:54:46] [DEBUG] [GLOBAL] test_user: 안녕하세요",
            createdAt: "2026-06-15T10:54:46.110Z",
          },
        ],
      },
      error: null,
    },
  },
};
