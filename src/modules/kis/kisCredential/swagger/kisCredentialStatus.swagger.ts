export const KIS_STATUS_API_DESCRIPTION =
  "현재 유저가 키를 등록했는지 확인합니다. 키 값은 반환하지 않으며, 등록 여부와 식별용 마스킹 값만 돌려줍니다.";

export const KIS_STATUS_SUCCESS_RESPONSE = {
  statusCode: 200,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/kis-credential",
  message: "KIS API 키 등록 상태 조회 성공",
  data: {
    registered: true,
    maskedAppKey: "PSxa****9f2c",
    registeredAt: "2026-06-09T10:00:00.000Z",
  },
  error: null,
};

// 200 - 미등록 상태
export const KIS_STATUS_UNREGISTERED_RESPONSE = {
  statusCode: 200,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/kis-credential",
  message: "KIS API 키 등록 상태 조회 성공",
  data: {
    registered: false,
    maskedAppKey: null,
    registeredAt: null,
  },
  error: null,
};

// 200 - 등록/미등록 상태 포함
export const KIS_STATUS_SUCCESS_API_RESPONSE = {
  status: 200,
  description: "KIS API 등록 상태 조회 성공",
  content: {
    "application/json": {
      examples: {
        registered: {
          summary: "등록된 경우",
          value: KIS_STATUS_SUCCESS_RESPONSE,
        },
        unregistered: {
          summary: "미등록인 경우",
          value: KIS_STATUS_UNREGISTERED_RESPONSE,
        },
      },
    },
  },
};

// 401 - 인증 실패
export const KIS_STATUS_UNAUTHORIZED_RESPONSE = {
  statusCode: 401,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/kis-credential",
  message: "인증이 필요합니다.",
  error: "UnauthorizedException",
  data: null,
};

export const KIS_STATUS_UNAUTHORIZED_API_RESPONSE = {
  status: 401,
  description: "쿠키 JWT 없음/만료/위조",
  schema: {
    example: KIS_STATUS_UNAUTHORIZED_RESPONSE,
  },
};

// 500 - 서버 내부 오류
export const KIS_STATUS_INTERNAL_SERVER_ERROR_RESPONSE = {
  statusCode: 500,
  timestamp: "2026-06-08T10:00:00.000Z",
  path: "/api/auth/kis-credential",
  message: "서버 내부 오류가 발생했습니다.",
  error: "InternalServerError",
  data: null,
};

export const KIS_STATUS_INTERNAL_SERVER_ERROR_API_RESPONSE = {
  status: 500,
  description: "서버 내부 오류",
  schema: {
    example: KIS_STATUS_INTERNAL_SERVER_ERROR_RESPONSE,
  },
};
