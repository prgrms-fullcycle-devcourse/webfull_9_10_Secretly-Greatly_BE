export const CHAT_MESSAGES_API_DESCRIPTION = `
특정 종목의 최근 채팅 메시지를 조회합니다.

- 최신순 정렬
- 신고로 숨김 처리된 메시지는 제외
- 페이지네이션 지원
`;

export const CHAT_MESSAGES_API_RESPONSE = {
  status: 200,
  description: "채팅 조회 성공",
  schema: {
    example: {
      statusCode: 200,
      message: "요청이 성공적으로 처리되었습니다.",
      data: {
        stockId: 1,
        ticker: "NVDA",
        stockName: "NVIDIA",
        page: 1,
        limit: 30,
        total: 5,
        messages: [
          {
            chatId: 5,
            roomId: 1,
            senderId: "uuid",
            nickname: "anonymous_xxxx",
            message: "안녕하세요",
            messageType: "NORMAL",
            reportCount: 0,
            isHidden: false,
            createdAt: "2026-06-08T09:25:18.658Z",
          },
        ],
      },
      error: null,
    },
  },
};

export const CHAT_MESSAGES_NOT_FOUND_API_RESPONSE = {
  status: 404,
  description: "존재하지 않는 종목",
  schema: {
    example: {
      statusCode: 404,
      message: "존재하지 않는 종목입니다.",
      data: null,
      error: "NotFoundException",
    },
  },
};
