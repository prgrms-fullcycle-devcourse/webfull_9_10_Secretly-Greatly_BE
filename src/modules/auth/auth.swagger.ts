export const LOGIN_SUCCESS_RESPONSE = {
  statusCode: 200,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/login",
  message: "로그인에 성공했습니다. 에디터 세션이 동기화됩니다.",
  data: {
    userId: "uuid",
    fixedNickname: "anonymous_ab12cd34",
    accessToken: "jwt-token",
  },
  error: null,
};

export const ANONYMOUS_SUCCESS_RESPONSE = {
  statusCode: 201,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/anonymous",
  message: "익명 임시 세션 발급이 완료되었습니다.",
  data: {
    userId: "uuid",
    anonymousToken: "uuid",
  },
  error: null,
};
