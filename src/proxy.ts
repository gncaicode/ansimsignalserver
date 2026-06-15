import { NextResponse, type NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

const LOCALES = ["ko", "ja"] as const;
const DEFAULT_LOCALE = "ko";
const COOKIE_NAME = "NEXT_LOCALE";

function detectLocale(request: NextRequest): string {
  // 1) 쿠키 우선 (사용자가 LocaleSwitcher로 명시적으로 선택한 경우)
  const cookieLocale = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieLocale && (LOCALES as readonly string[]).includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2) Accept-Language 헤더
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headers[k] = v;
  });
  const languages = new Negotiator({ headers }).languages();

  try {
    return match(languages, LOCALES as unknown as string[], DEFAULT_LOCALE);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (pathnameHasLocale) return;

  const locale = detectLocale(request);
  const target = request.nextUrl.clone();
  target.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(target);
}

export const config = {
  // _next, api, 정적 파일(확장자 포함)은 제외
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
