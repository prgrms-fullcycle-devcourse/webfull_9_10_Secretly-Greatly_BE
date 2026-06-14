export const CHAT_REPORT_API_DESCRIPTION =
  "부적절한 채팅 메시지를 신고합니다. 동일 사용자는 같은 메시지를 중복 신고할 수 없으며, 신고 누적 수가 5회 이상이면 메시지가 블라인드 처리됩니다.";

export const CHAT_REPORT_API_RESPONSE = {
  status: 200,
  description: "신고 성공",
  schema: {
    example: {
      statusCode: 200,
      timestamp: "2026-06-12T15:00:00.000Z",
      path: "/api/chats/1/report",
      message: "요청이 성공적으로 처리되었습니다.",
      data: {
        message: "해당 메시지에 대한 신고가 접수되었습니다.",
        chatId: 1,
        currentReportCount: 1,
        isBlinded: false,
      },
      error: null,
    },
  },
};

export const CHAT_REPORT_NOT_FOUND_API_RESPONSE = {
  status: 404,
  description: "채팅을 찾을 수 없음",
  schema: {
    example: {
      statusCode: 404,
      timestamp: "2026-06-12T15:00:00.000Z",
      path: "/api/chats/99999/report",
      message: "존재하지 않는 채팅 메시지입니다.",
      data: null,
      error: "NotFoundException",
    },
  },
};

export const CHAT_REPORT_CONFLICT_API_RESPONSE = {
  status: 409,
  description: "이미 신고한 메시지",
  schema: {
    example: {
      statusCode: 409,
      timestamp: "2026-06-12T15:00:00.000Z",
      path: "/api/chats/1/report",
      message: "이미 신고한 메시지입니다.",
      data: null,
      error: "ConflictException",
    },
  },
};
