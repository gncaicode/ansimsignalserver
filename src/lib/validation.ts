export const INTERVAL_HOURS_MIN = 12;
export const INTERVAL_HOURS_MAX = 48;

export function isValidIntervalHours(h: number): boolean {
  return Number.isInteger(h) && h >= INTERVAL_HOURS_MIN && h <= INTERVAL_HOURS_MAX;
}
