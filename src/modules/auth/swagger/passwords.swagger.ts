export const PASSWORD_RESET_API_DESCRIPTION =
  "비로그인 상태의 사용자가 가입한 이메일을 입력하여, 해당 메일로 임시 비밀번호 받고자 할 때 호출합니다.";

export const PASSWORD_RESET_SUCCESS_RESPONSE = {
  statusCode: 200,
  timestamp: "2026-06-11T10:00:00.000Z",
  path: "/api/auth/passwords/reset-request",
  message: "등록된 이메일로 임시 비밀번호가 발송되었습니다. 메일함을 확인해주세요.",
  data: { mailSent: true },
  error: null,
};

export const PASSWORD_RESET_SUCCESS_API_RESPONSE = {
  status: 200,
  description: "임시 비밀번호 메일 발송 성공",
  schema: { example: PASSWORD_RESET_SUCCESS_RESPONSE },
};

export const PASSWORD_RESET_NOT_FOUND_RESPONSE = {
  statusCode: 404,
  timestamp: "2026-06-11T10:01:00.000Z",
  path: "/api/auth/passwords/reset-request",
  message: "등록되지 않은 이메일 주소입니다.",
  error: "UserNotFoundException",
  data: null,
};

export const PASSWORD_RESET_NOT_FOUND_API_RESPONSE = {
  status: 404,
  description: "미등록 이메일 주소 요청 실패",
  schema: { example: PASSWORD_RESET_NOT_FOUND_RESPONSE },
};

export const PASSWORD_CHANGE_API_DESCRIPTION =
  "사용자가 메일로 수신한 임시 비밀번호로 로그인에 성공한 직후, 또는 일반 고정닉 유저가 대시보드 환경설정 창을 통해 본인만의 안전한 암호로 교체할 때 호출합니다.";

export const PASSWORD_CHANGE_SUCCESS_RESPONSE = {
  statusCode: 200,
  timestamp: "2026-06-11T10:05:00.000Z",
  path: "/api/auth/passwords",
  message: "비밀번호 재설정이 완료되었습니다. 새 비밀번호로 다시 로그인해주세요.",
  data: { passwordUpdated: true },
  error: null,
};

export const PASSWORD_CHANGE_SUCCESS_API_RESPONSE = {
  status: 200,
  description: "비밀번호 재설정 및 변경 성공",
  schema: { example: PASSWORD_CHANGE_SUCCESS_RESPONSE },
};

export const PASSWORD_CHANGE_MISMATCH_RESPONSE = {
  statusCode: 400,
  timestamp: "2026-06-11T10:06:00.000Z",
  path: "/api/auth/passwords",
  message: "새로 입력한 비밀번호 확인이 일치하지 않습니다.",
  error: "PasswordMismatchException",
  data: null,
};

export const PASSWORD_CHANGE_MISMATCH_API_RESPONSE = {
  status: 400,
  description: "새 비밀번호 입력값 불일치 또는 유효성 규약 위반",
  schema: { example: PASSWORD_CHANGE_MISMATCH_RESPONSE },
};

export const PASSWORD_CHANGE_INVALID_RESPONSE = {
  statusCode: 401,
  timestamp: "2026-06-11T10:07:00.000Z",
  path: "/api/auth/passwords",
  message: "기존 비밀번호가 일치하지 않습니다.",
  error: "InvalidPasswordException",
  data: null,
};

export const PASSWORD_CHANGE_INVALID_API_RESPONSE = {
  status: 401,
  description: "비밀번호 인증 실패",
  schema: { example: PASSWORD_CHANGE_INVALID_RESPONSE },
};
