export const ALERT_CONFIG = {
  //사용자당 최대 감시 종목 수
  MAX_MONITORED_STOCKS: 10,

  //WARN 판단 시간 범위
  WARN_WINDOW_MINUTES: 3,
  //WARN 발생 변동률
  WARN_THRESHOLD_PERCENT: 2,

  //CRITICAL 판단 시간 범위
  CRITICAL_WINDOW_MINUTES: 5,
  //CRITICAL 발생 변동률
  CRITICAL_THRESHOLD_PERCENT: 3,
} as const;

export const STREAM_EVENTS = {
  TERMINAL_ALERT: "terminal_alert",
  STREAM_ERROR: "stream_error",
} as const;

export const getUserRoomName = (userId: string) => `user:${userId}`;
