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
