import type { Locale } from "./index";

const intlLocaleMap: Record<Locale, string> = {
  ko: "ko-KR",
  ja: "ja-JP",
};

export function formatRelativeTime(
  isoOrDate: string | Date,
  locale: Locale,
): string {
  const target =
    typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const diffMs = Date.now() - target.getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return locale === "ko" ? "방금 전" : "たった今";

  const rtf = new Intl.RelativeTimeFormat(intlLocaleMap[locale], {
    numeric: "always",
    style: "long",
  });

  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  return rtf.format(-days, "day");
}

export function formatElapsed(hoursElapsed: number, locale: Locale): string {
  const isJa = locale === "ja";

  if (hoursElapsed < 1) {
    const m = Math.floor(hoursElapsed * 60);
    return isJa ? `${m}分未確認` : `${m}분 미확인`;
  }

  if (hoursElapsed < 24) {
    const h = Math.floor(hoursElapsed);
    return isJa ? `${h}時間未確認` : `${h}시간 미확인`;
  }

  const d = Math.floor(hoursElapsed / 24);
  const h = Math.floor(hoursElapsed % 24);

  if (isJa) {
    return h ? `${d}日${h}時間未確認` : `${d}日未確認`;
  }
  return h ? `${d}일 ${h}시간 미확인` : `${d}일 미확인`;
}

export function formatShortDateTime(isoOrDate: string | Date, locale: Locale) {
  const date =
    typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat(intlLocaleMap[locale], {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatLongDateTime(isoOrDate: string | Date, locale: Locale) {
  const date =
    typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat(intlLocaleMap[locale], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
