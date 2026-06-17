export const ALERT_CONFIG = {
  MAX_MONITORED_STOCKS: 10,

  WARN_WINDOW_MINUTES: 3,
  WARN_THRESHOLD_PERCENT: 2,

  CRITICAL_WINDOW_MINUTES: 5,
  CRITICAL_THRESHOLD_PERCENT: 3,
} as const;

export const STREAM_EVENTS = {
  TERMINAL_ALERT: "terminal_alert",
  STREAM_ERROR: "stream_error",
} as const;

export const getUserRoomName = (userId: string) => `user:${userId}`;
