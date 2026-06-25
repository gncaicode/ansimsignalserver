import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, getSession } from "@/lib/session";
import { logAccess } from "@/lib/access-log";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session) {
    await logAccess({ adminId: session.admin_id, action: "logout", email: session.email, req });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return res;
}
