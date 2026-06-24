import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { execute, query } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface ActionLogRow extends RowDataPacket {
  log_id: number;
  action_type: string;
  note: string | null;
  created_at: string;
  admin_name: string | null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const { rows } = await query<ActionLogRow>(
    `SELECT l.log_id, l.action_type, l.note, l.created_at, a.name AS admin_name
     FROM action_logs l
     LEFT JOIN admins a ON l.admin_id = a.admin_id
     WHERE l.user_id = ?
     ORDER BY l.created_at DESC
     LIMIT 20`,
    [Number(id)],
  );

  return NextResponse.json({ logs: rows });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (!["superadmin", "admin", "social_worker"].includes(session.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const action_type = String(body.action_type ?? "other");
  const note = body.note ? String(body.note).trim() : null;

  const validTypes = ["visit", "call", "sms", "hospital", "other"];
  if (!validTypes.includes(action_type)) {
    return NextResponse.json({ error: "올바른 조치 유형을 선택해주세요." }, { status: 400 });
  }

  await execute(
    `INSERT INTO action_logs (user_id, admin_id, action_type, note) VALUES (?, ?, ?, ?)`,
    [Number(id), session.admin_id, action_type, note],
  );

  return NextResponse.json({ ok: true });
}
