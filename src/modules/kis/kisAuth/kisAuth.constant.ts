export const KIS_OAUTH = {
  TOKEN_PATH: "/oauth2/tokenP",
} as const;

// Redis 토큰 키 (유저별 분리)
export const kisTokenKey = (userId: string) => `kis:token:${userId}`;

// 만료 10분 전에 토큰 재발급
export const TOKEN_EXPIRE_MARGIN_SEC = 600;
