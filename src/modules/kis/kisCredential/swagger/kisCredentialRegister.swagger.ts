export const KIS_REGISTER_API_DESCRIPTION = "유저가 KIS에서 발급받은 appkey/appsecret을 우리 서비스에 등록합니다.";

export const KIS_REGISTER_SUCCESS_RESPONSE = {
  statusCode: 201,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/kis-credential",
  message: "KIS API 키가 등록되었습니다.",
  data: {
    registered: true,
    maskedAppKey: "PSxa****9f2c",
    registeredAt: "2026-06-09T10:00:00.000Z",
  },
  error: null,
};

export const KIS_REGISTER_SUCCESS_API_RESPONSE = {
  status: 201,
  description: "KIS API 등록 성공",
  schema: {
    example: KIS_REGISTER_SUCCESS_RESPONSE,
  },
};

export const KIS_REGISTER_VALIDATION_RESPONSE = {
  statusCode: 400,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/kis-credential",
  message: "appKey는 필수 항목입니다.",
  error: "ValidationException",
  data: null,
};

export const KIS_REGISTER_VALIDATION_API_RESPONSE = {
  status: 400,
  description: "유효성 검사 실패 - 필수값 누락 등",
  schema: {
    example: KIS_REGISTER_VALIDATION_RESPONSE,
  },
};

export const KIS_REGISTER_UNAUTHORIZED_RESPONSE = {
  statusCode: 401,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/kis-credential",
  message: "인증이 필요합니다.",
  error: "UnauthorizedException",
  data: null,
};

export const KIS_REGISTER_UNAUTHORIZED_API_RESPONSE = {
  status: 401,
  description: "쿠키 JWT 없음/만료/위조",
  schema: {
    example: KIS_REGISTER_UNAUTHORIZED_RESPONSE,
  },
};

export const KIS_REGISTER_CONFLICT_RESPONSE = {
  statusCode: 409,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/kis-credential",
  message: "이미 등록된 KIS API 키가 있습니다.",
  error: "DuplicateException",
  data: null,
};

export const KIS_REGISTER_CONFLICT_API_RESPONSE = {
  status: 409,
  description: "유저가 이미 key를 등록한 경우",
  schema: {
    example: KIS_REGISTER_CONFLICT_RESPONSE,
  },
};

export const KIS_REGISTER_INVALID_CREDENTIAL_RESPONSE = {
  statusCode: 422,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/kis-credential",
  message: "유효하지 않은 KIS API 키입니다. KIS에서 발급받은 키를 확인해주세요.",
  error: "InvalidKisCredentialException",
  data: null,
};

export const KIS_REGISTER_INVALID_CREDENTIAL_API_RESPONSE = {
  status: 422,
  description: "한투에서 key가 거부됨",
  schema: {
    example: KIS_REGISTER_INVALID_CREDENTIAL_RESPONSE,
  },
};

export const KIS_REGISTER_INTERNAL_SERVER_ERROR_RESPONSE = {
  statusCode: 500,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/login",
  message: "서버 내부 오류가 발생했습니다.",
  error: "InternalServerError",
  data: null,
};

export const KIS_REGISTER_INTERNAL_SERVER_ERROR_API_RESPONSE = {
  status: 500,
  description: "서버 내부 오류",
  schema: {
    example: KIS_REGISTER_INTERNAL_SERVER_ERROR_RESPONSE,
  },
};
