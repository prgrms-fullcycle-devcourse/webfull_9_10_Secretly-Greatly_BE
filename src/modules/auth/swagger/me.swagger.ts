export const ME_API_DESCRIPTION = `
현재 인증된 사용자의 정보를 조회합니다.

- Authorization Bearer Token 인증 지원
- HttpOnly Cookie(accessToken) 인증 지원
- 로그인 사용자 / 익명 사용자 모두 조회 가능
`;

export const ME_API_RESPONSE = {
  status: 200,
  description: "현재 사용자 조회 성공",
  schema: {
    example: {
      statusCode: 200,
      timestamp: "2026-06-09T08:39:11.415Z",
      path: "/api/auth/me",
      message: "현재 로그인 사용자 조회에 성공했습니다.",
      data: {
        userId: "987d04d6-5ed4-473f-b6ee-1b1b8af3b019",
        email: null,
        nickname: "anonymous_3923f180",
        isAnonymous: true,
        createdAt: "2026-06-09T08:35:17.652Z",
      },
      error: null,
    },
  },
};

export const ME_UNAUTHORIZED_API_RESPONSE = {
  status: 401,
  description: "인증 실패",
  schema: {
    example: {
      statusCode: 401,
      timestamp: "2026-06-09T08:40:00.000Z",
      path: "/api/auth/me",
      message: "인증이 만료되었거나 유효하지 않습니다.",
      data: null,
      error: "Unauthorized",
    },
  },
};

export const ME_NOT_FOUND_API_RESPONSE = {
  status: 404,
  description: "사용자 없음",
  schema: {
    example: {
      statusCode: 404,
      timestamp: "2026-06-09T08:40:00.000Z",
      path: "/api/auth/me",
      message: "사용자를 찾을 수 없습니다.",
      data: null,
      error: "Not Found",
    },
  },
};
