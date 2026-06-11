// --- 201 Created: 회원가입 성공 ---
export const SIGNUP_SUCCESS_RESPONSE = {
  statusCode: 201,
  timestamp: "2026-06-02T09:41:10.242Z",
  path: "/api/auth",
  message: "고정닉 회원가입이 완료되었습니다.",
  data: {
    userId: "d3b07384-d113-4956-a5d2-aa58986231a1", // Prisma UUID 스펙 반영
  },
  error: null,
};

export const SIGNUP_API_RESPONSE = {
  status: 201,
  description: "고정닉 회원가입 성공",
  schema: {
    example: SIGNUP_SUCCESS_RESPONSE,
  },
};

// --- 400 Bad Request: DTO 벨리데이션 실패 (8~16자 상한선 규약 미준수 등) ---
export const SIGNUP_VALIDATION_ERROR_RESPONSE = {
  statusCode: 400,
  timestamp: "2026-06-02T09:41:15.317Z",
  path: "/api/auth",
  message:
    "비밀번호는 8자 이상 16자 이하의 영문, 숫자, 특수문자를 포함해야 합니다.",
  data: null,
  error: "ValidationException", // 가공 필터 대응 명칭
};

export const SIGNUP_VALIDATION_API_RESPONSE = {
  status: 400,
  description:
    "비밀번호 글자수 상한선 규약 미준수 및 입력 포맷 유효성 검사 실패",
  schema: {
    example: SIGNUP_VALIDATION_ERROR_RESPONSE,
  },
};

// --- 400 Bad Request: 비밀번호 확인 불일치 ---
export const SIGNUP_MISMATCH_ERROR_RESPONSE = {
  statusCode: 400,
  timestamp: "2026-06-02T09:41:18.456Z",
  path: "/api/auth",
  message: "비밀번호 확인이 일치하지 않습니다.",
  data: null,
  error: "PasswordMismatchException", // 커스텀 비즈니스 예외명
};

export const SIGNUP_MISMATCH_API_RESPONSE = {
  status: 400,
  description: "비밀번호와 비밀번호 확인 필드 데이터 불일치",
  schema: {
    example: SIGNUP_MISMATCH_ERROR_RESPONSE,
  },
};

// --- 409 Conflict: 이메일 중복 ---
export const SIGNUP_DUPLICATE_EMAIL_RESPONSE = {
  statusCode: 409,
  timestamp: "2026-06-02T09:41:22.107Z",
  path: "/api/auth",
  message: "이미 사용 중인 이메일입니다.",
  data: null,
  error: "DuplicateEmailException",
};

export const SIGNUP_DUPLICATE_EMAIL_API_RESPONSE = {
  status: 409,
  description: "요청한 가입 이메일이 이미 디바이스 인프라(DB)에 존재함",
  schema: {
    example: SIGNUP_DUPLICATE_EMAIL_RESPONSE,
  },
};

// --- 409 Conflict: 닉네임 선점 중복 ---
export const SIGNUP_DUPLICATE_NICKNAME_RESPONSE = {
  statusCode: 409,
  timestamp: "2026-06-02T09:41:25.889Z",
  path: "/api/auth",
  message: "이미 다른 사용자가 선점한 고정 닉네임입니다.",
  data: null,
  error: "DuplicateNicknameException",
};

export const SIGNUP_DUPLICATE_NICKNAME_API_RESPONSE = {
  status: 409,
  description: "요청한 고정 닉네임이 다른 사용자에 의해 이미 선점됨",
  schema: {
    example: SIGNUP_DUPLICATE_NICKNAME_RESPONSE,
  },
};
