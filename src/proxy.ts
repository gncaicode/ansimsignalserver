import { NextResponse, type NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { jwtVerify } from "jose";

const LOCALES = ["ko", "ja"] as const;
const DEFAULT_LOCALE = "ko";
const LOCALE_COOKIE = "NEXT_LOCALE";
const SESSION_COOKIE = "admin_session";
const SYSTEM_COOKIE = "system_session";

// (app) 보호 경로
const PROTECTED = /^\/[a-z]{2}\/(dashboard|users|managers|alerts|reports|settings)/;
// 시스템 보호 경로
const SYSTEM_PROTECTED = /^\/system\/(logs)/;

function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && (LOCALES as readonly string[]).includes(cookieLocale)) {
    return cookieLocale;
  }

  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => { headers[k] = v; });
  const languages = new Negotiator({ headers }).languages();

  try {
    return match(languages, LOCALES as unknown as string[], DEFAULT_LOCALE);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) 시스템 보호 경로 검사 (로케일 리다이렉트 전에)
  if (SYSTEM_PROTECTED.test(pathname)) {
    const token = request.cookies.get(SYSTEM_COOKIE)?.value;
    let valid = false;
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET! + "_system");
        await jwtVerify(token, secret);
        valid = true;
      } catch {
        // 만료 또는 무효
      }
    }
    if (!valid) {
      return NextResponse.redirect(new URL("/system/login", request.url));
    }
    return NextResponse.next();
  }

  // 2) 시스템 경로 및 공개 페이지는 로케일 리다이렉트 제외
  if (pathname.startsWith("/system") || pathname.startsWith("/delete-account")) {
    return NextResponse.next();
  }

  // 3) 로케일 리다이렉트
  const pathnameHasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (!pathnameHasLocale) {
    const locale = detectLocale(request);
    const target = request.nextUrl.clone();
    target.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(target);
  }

  // 4) 보호 경로 인증 검사
  if (PROTECTED.test(pathname)) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    let valid = false;

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        await jwtVerify(token, secret);
        valid = true;
      } catch {
        // 만료 또는 무효
      }
    }

    if (!valid) {
      const lang = pathname.split("/")[1] ?? "ko";
      const loginUrl = new URL(`/${lang}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 로그인 필수 관리 화면은 어떤 중간 프록시/브라우저도 캐시하지 않도록 명시
    // (기관 네트워크의 보안 프록시 등이 쿼리스트링을 무시하고 캐시하는 경우 대비)
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, must-revalidate");
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
