import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskPhone(phone: string): string {
  return phone.replace(/(\d{2,3})-?(\d{3,4})-?(\d{4})/, (_, a, _b, c) =>
    `${a}-****-${c}`,
  );
}

// 시간/날짜 포맷터는 lib/i18n/format.ts에 위치 (locale-aware)

// MySQL DATETIME 파라미터용 KST 현재 시각 ("YYYY-MM-DD HH:MM:SS.mmm")
// Date.now()는 항상 UTC ms이므로 +9h 보정 후 toISOString()으로 KST 벽시계 문자열 생성
// → MySQL 서버 타임존(KST)에 맞는 DATETIME 문자열을 안전하게 삽입
export function nowKst(): string {
  return new Date(Date.now() + 9 * 3_600_000)
    .toISOString()
    .slice(0, 23)
    .replace('T', ' ');
}
