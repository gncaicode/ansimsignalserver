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
// MySQL 서버가 UTC이므로 NOW(3)을 쓰는 대신 Node.js에서 직접 계산해 전달
export function nowKst(): string {
  return new Date(Date.now() + 9 * 3_600_000)
    .toISOString()
    .slice(0, 23)
    .replace('T', ' ');
}
