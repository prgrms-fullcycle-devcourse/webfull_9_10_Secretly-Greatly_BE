export const LOGIN_API_DESCRIPTION =
  "고정닉을 선점한 사용자가 디바이스를 변경하거나 재접속 시 정식 JWT 세션을 발급받기 위해 호출합니다.";

export const ANONYMOUS_API_DESCRIPTION =
  "비회원 사용자가 별도 회원가입 없이 임시 세션을 발급받기 위해 호출합니다.";

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

export const ANONYMOUS_SUCCESS_RESPONSE = {
  statusCode: 201,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/anonymous",
  message: "익명 임시 세션 발급이 완료되었습니다.",
  data: {
    userId: "550e8400-e29b-41d4-a716-446655440000",
    anonymousToken: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  },
  error: null,
};
