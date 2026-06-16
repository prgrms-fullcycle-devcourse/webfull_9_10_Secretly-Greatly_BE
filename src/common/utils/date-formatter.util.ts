export function getRemainingSecondsToMidnight(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const remainingSeconds = Math.floor((midnight.getTime() - now.getTime()) / 1000);
  return remainingSeconds > 0 ? remainingSeconds : 1; // 음수 방어 및 최소 1초 보장
}
