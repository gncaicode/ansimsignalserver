import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { logAccess, type AccessAction } from "@/lib/access-log";

// DashboardRefresher가 여러 화면에서 공용으로 쓰이므로, 마운트된 화면에 맞는 조회 액션만 기록한다.
const ALLOWED_ACTIONS: AccessAction[] = ["view_dashboard"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as AccessAction;
  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  await logAccess({ adminId: session.admin_id, action, req });
  return NextResponse.json({ ok: true });
}
