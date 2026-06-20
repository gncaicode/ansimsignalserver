import { NextResponse, type NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { jwtVerify } from "jose";

const LOCALES = ["ko", "ja"] as const;
const DEFAULT_LOCALE = "ko";
const LOCALE_COOKIE = "NEXT_LOCALE";
const SESSION_COOKIE = "admin_session";

// (app) 보호 경로
const PROTECTED = /^\/[a-z]{2}\/(dashboard|users|managers|alerts|reports|settings)/;

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

  // 1) 로케일 리다이렉트
  const pathnameHasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (!pathnameHasLocale) {
    const locale = detectLocale(request);
    const target = request.nextUrl.clone();
    target.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(target);
  }

  // 2) 보호 경로 인증 검사
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
  }
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
