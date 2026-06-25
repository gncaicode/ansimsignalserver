import { NextResponse } from "next/server";
import { SYSTEM_COOKIE } from "@/lib/system-session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SYSTEM_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
