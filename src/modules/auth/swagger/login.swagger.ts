export const LOGIN_API_DESCRIPTION =
  "고정닉을 선점한 사용자가 디바이스를 변경하거나 재접속 시 정식 JWT 세션을 발급받기 위해 호출합니다.";

export const LOGIN_SUCCESS_RESPONSE = {
  statusCode: 200,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/login",
  message: "로그인에 성공했습니다.",
  data: {
    userId: "550e8400-e29b-41d4-a716-446655440000",
    fixedNickname: "난이춘식",
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },
  error: null,
};

export const LOGIN_API_RESPONSE = {
  status: 200,
  description: "로그인 성공",
  schema: {
    example: LOGIN_SUCCESS_RESPONSE,
  },
};

export const LOGIN_UNAUTHORIZED_RESPONSE = {
  statusCode: 401,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/login",
  message: "이메일 또는 비밀번호가 일치하지 않습니다.",
  data: null,
  error: "Unauthorized",
};

export const LOGIN_UNAUTHORIZED_API_RESPONSE = {
  status: 401,
  description: "이메일 또는 비밀번호 불일치",
  schema: {
    example: LOGIN_UNAUTHORIZED_RESPONSE,
  },
};

export const LOGIN_INTERNAL_SERVER_ERROR_RESPONSE = {
  statusCode: 500,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/login",
  message: "서버 내부 오류가 발생했습니다.",
  error: "InternalServerError",
  data: null,
};

export const LOGIN_INTERNAL_SERVER_ERROR_API_RESPONSE = {
  status: 500,
  description: "서버 내부 오류",
  schema: {
    example: LOGIN_INTERNAL_SERVER_ERROR_RESPONSE,
  },
};
