export const POSITIONS_CREATE_API_DESCRIPTION =
  "내 종목 등록용. 사용자의 매수 내역 배열을 받아 stockId 기준으로 그룹핑한 뒤 " +
  "평균 매수가, 총 보유 수량, 총 투자 금액을 계산하여 Position으로 저장합니다.";

// ── POST /api/positions 201 성공 ─────────────────────────────────────
export const POSITIONS_CREATE_SUCCESS_RESPONSE = {
  statusCode: 201,
  timestamp: "2026-06-17T07:00:00.000Z",
  path: "/api/positions",
  message: "내 종목이 성공적으로 추가되었습니다.",
  data: [
    {
      positionId: 5,
      stockId: 1,
      stockName: "삼성전자",
      market: "KR",
      averagePrice: 27000,
      quantity: 6,
      totalInvestedAmount: 162000,
    },
    {
      positionId: 6,
      stockId: 28,
      stockName: "기아",
      market: "KR",
      averagePrice: 100000,
      quantity: 3,
      totalInvestedAmount: 300000,
    },
  ],
  error: null,
};

export const POSITIONS_CREATE_SUCCESS_API_RESPONSE = {
  status: 201,
  description: "내 종목 일괄 등록 성공",
  schema: {
    example: POSITIONS_CREATE_SUCCESS_RESPONSE,
  },
};

// ── POST /api/positions 400 유효성 실패 ───────────────────────────────
export const POSITIONS_CREATE_VALIDATION_RESPONSE = {
  statusCode: 400,
  timestamp: "2026-06-17T07:00:00.000Z",
  path: "/api/positions",
  message: "GLOBAL_CHAT은 내 종목으로 등록할 수 없습니다.",
  data: null,
  error: "BadRequestException",
};

export const POSITIONS_CREATE_VALIDATION_API_RESPONSE = {
  status: 400,
  description: "잘못된 요청 Body 또는 GLOBAL_CHAT 등록 시도",
  schema: {
    example: POSITIONS_CREATE_VALIDATION_RESPONSE,
  },
};

// ── 공통 401 인증 실패 ────────────────────────────────────────────────
export const POSITIONS_UNAUTHORIZED_RESPONSE = {
  statusCode: 401,
  timestamp: "2026-06-17T07:00:00.000Z",
  path: "/api/positions",
  message: "인증이 필요합니다.",
  data: null,
  error: "UnauthorizedException",
};

export const POSITIONS_UNAUTHORIZED_API_RESPONSE = {
  status: 401,
  description: "쿠키 JWT 없음/만료/위조",
  schema: {
    example: POSITIONS_UNAUTHORIZED_RESPONSE,
  },
};

// ── POST /api/positions 404 종목 없음 ────────────────────────────────
export const POSITIONS_CREATE_NOT_FOUND_RESPONSE = {
  statusCode: 404,
  timestamp: "2026-06-17T07:00:00.000Z",
  path: "/api/positions",
  message: "존재하지 않거나 파기된 주식 자산 엔티티입니다. (요청 ID: 999999)",
  data: null,
  error: "AssetEntityNotFoundException",
};

export const POSITIONS_CREATE_NOT_FOUND_API_RESPONSE = {
  status: 404,
  description: "존재하지 않는 종목 ID",
  schema: {
    example: POSITIONS_CREATE_NOT_FOUND_RESPONSE,
  },
};

// ── POST /api/positions 409 중복 등록 ────────────────────────────────
export const POSITIONS_CREATE_CONFLICT_RESPONSE = {
  statusCode: 409,
  timestamp: "2026-06-17T07:00:00.000Z",
  path: "/api/positions",
  message: "이미 내 종목에 등록된 종목입니다. stockId: 1",
  data: null,
  error: "ConflictException",
};

export const POSITIONS_CREATE_CONFLICT_API_RESPONSE = {
  status: 409,
  description: "이미 내 종목에 등록된 종목",
  schema: {
    example: POSITIONS_CREATE_CONFLICT_RESPONSE,
  },
};

// ── GET /api/positions 200 성공 ──────────────────────────────────────
export const POSITIONS_FETCH_ALL_API_DESCRIPTION =
  "사용자가 등록한 내 종목 리스트를 조회합니다. 국장/미장 등 분류를 위해 market 값을 함께 반환합니다.";

export const POSITIONS_FETCH_ALL_SUCCESS_RESPONSE = {
  statusCode: 200,
  timestamp: "2026-06-17T07:01:00.000Z",
  path: "/api/positions",
  message: "내 종목 리스트 조회가 완료되었습니다.",
  data: [
    {
      positionId: 5,
      stockId: 1,
      stockCode: "005930",
      stockName: "삼성전자",
      market: "KR",
      averagePrice: 27000,
      quantity: 6,
      totalInvestedAmount: 162000,
      createdAt: "2026-06-17T06:59:58.931Z",
      updatedAt: "2026-06-17T06:59:58.931Z",
    },
    {
      positionId: 6,
      stockId: 28,
      stockCode: "000270",
      stockName: "기아",
      market: "KR",
      averagePrice: 100000,
      quantity: 3,
      totalInvestedAmount: 300000,
      createdAt: "2026-06-17T06:59:58.926Z",
      updatedAt: "2026-06-17T06:59:58.926Z",
    },
  ],
  error: null,
};

export const POSITIONS_FETCH_ALL_SUCCESS_API_RESPONSE = {
  status: 200,
  description: "내 종목 리스트 조회 성공",
  schema: {
    example: POSITIONS_FETCH_ALL_SUCCESS_RESPONSE,
  },
};

// ── PATCH /api/positions/:positionId ─────────────────────────────────
export const POSITIONS_UPDATE_API_DESCRIPTION =
  "사용자가 등록한 내 종목의 평단가와 보유 수량을 수정합니다. " +
  "totalInvestedAmount는 averagePrice * quantity 기준으로 서버에서 재계산합니다.";

export const POSITIONS_UPDATE_SUCCESS_RESPONSE = {
  statusCode: 200,
  timestamp: "2026-06-17T07:03:00.000Z",
  path: "/api/positions/5",
  message: "내 종목 수정에 성공했습니다.",
  data: {
    positionId: 5,
    stockId: 1,
    stockCode: "005930",
    stockName: "삼성전자",
    market: "KR",
    averagePrice: 28000,
    quantity: 7,
    totalInvestedAmount: 196000,
    createdAt: "2026-06-17T06:59:58.931Z",
    updatedAt: "2026-06-17T07:03:00.000Z",
  },
  error: null,
};

export const POSITIONS_UPDATE_SUCCESS_API_RESPONSE = {
  status: 200,
  description: "내 종목 수정 성공",
  schema: {
    example: POSITIONS_UPDATE_SUCCESS_RESPONSE,
  },
};

export const POSITIONS_UPDATE_VALIDATION_RESPONSE = {
  statusCode: 400,
  timestamp: "2026-06-17T07:03:00.000Z",
  path: "/api/positions/5",
  message: "수정할 매수 정보가 없습니다.",
  data: null,
  error: "BadRequestException",
};

export const POSITIONS_UPDATE_VALIDATION_API_RESPONSE = {
  status: 400,
  description: "수정할 필드가 없거나 요청 Body가 잘못됨",
  schema: {
    example: POSITIONS_UPDATE_VALIDATION_RESPONSE,
  },
};

export const POSITIONS_UPDATE_NOT_FOUND_RESPONSE = {
  statusCode: 404,
  timestamp: "2026-06-17T07:03:00.000Z",
  path: "/api/positions/999999",
  message: "수정할 내 종목을 찾을 수 없습니다.",
  data: null,
  error: "NotFoundException",
};

export const POSITIONS_UPDATE_NOT_FOUND_API_RESPONSE = {
  status: 404,
  description: "수정할 내 종목을 찾을 수 없음",
  schema: {
    example: POSITIONS_UPDATE_NOT_FOUND_RESPONSE,
  },
};

export const POSITIONS_UPDATE_FORBIDDEN_RESPONSE = {
  statusCode: 403,
  timestamp: "2026-06-17T07:03:00.000Z",
  path: "/api/positions/5",
  message: "해당 내 종목을 수정할 권한이 없습니다.",
  data: null,
  error: "ForbiddenException",
};

export const POSITIONS_UPDATE_FORBIDDEN_API_RESPONSE = {
  status: 403,
  description: "다른 사용자의 내 종목 수정 시도",
  schema: {
    example: POSITIONS_UPDATE_FORBIDDEN_RESPONSE,
  },
};

// ── DELETE /api/positions/:positionId 200 성공 ───────────────────────
export const POSITIONS_DELETE_API_DESCRIPTION = "사용자가 등록한 내 종목을 삭제합니다.";

export const POSITIONS_DELETE_SUCCESS_RESPONSE = {
  statusCode: 200,
  timestamp: "2026-06-17T07:02:00.000Z",
  path: "/api/positions/5",
  message: "내 종목이 성공적으로 삭제되었습니다.",
  data: {
    positionId: 5,
  },
  error: null,
};

export const POSITIONS_DELETE_SUCCESS_API_RESPONSE = {
  status: 200,
  description: "내 종목 삭제 성공",
  schema: {
    example: POSITIONS_DELETE_SUCCESS_RESPONSE,
  },
};

// ── DELETE /api/positions/:positionId 404 없음 ───────────────────────
export const POSITIONS_DELETE_NOT_FOUND_RESPONSE = {
  statusCode: 404,
  timestamp: "2026-06-17T07:02:00.000Z",
  path: "/api/positions/999999",
  message: "삭제할 내 종목을 찾을 수 없습니다.",
  data: null,
  error: "NotFoundException",
};

export const POSITIONS_DELETE_NOT_FOUND_API_RESPONSE = {
  status: 404,
  description: "삭제할 내 종목을 찾을 수 없음",
  schema: {
    example: POSITIONS_DELETE_NOT_FOUND_RESPONSE,
  },
};
