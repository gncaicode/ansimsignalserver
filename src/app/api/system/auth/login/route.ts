import { NextRequest, NextResponse } from "next/server";
import { createSystemSession, SYSTEM_COOKIE } from "@/lib/system-session";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!password) {
    return NextResponse.json({ error: "비밀번호를 입력하세요." }, { status: 400 });
  }

  const systemPassword = process.env.SYSTEM_PASSWORD;
  if (!systemPassword || password !== systemPassword) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = await createSystemSession();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SYSTEM_COOKIE, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8h
  });

  return res;
}
