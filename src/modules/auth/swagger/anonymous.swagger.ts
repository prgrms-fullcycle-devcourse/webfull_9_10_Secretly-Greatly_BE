export const ANONYMOUS_API_DESCRIPTION = "비회원 사용자가 별도 회원가입 없이 임시 세션을 발급받기 위해 호출합니다.";

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

export const ANONYMOUS_API_RESPONSE = {
  status: 201,
  description: "익명 임시 세션 발급 성공",
  schema: {
    example: ANONYMOUS_SUCCESS_RESPONSE,
  },
};

export const ANONYMOUS_INTERNAL_SERVER_ERROR_RESPONSE = {
  statusCode: 500,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/anonymous",
  message: "서버 내부 오류가 발생했습니다.",
  error: "InternalServerError",
  data: null,
};

export const ANONYMOUS_INTERNAL_SERVER_ERROR_API_RESPONSE = {
  status: 500,
  description: "서버 내부 오류",
  schema: {
    example: ANONYMOUS_INTERNAL_SERVER_ERROR_RESPONSE,
  },
};
