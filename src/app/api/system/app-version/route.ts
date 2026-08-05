import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { verifySystemToken, SYSTEM_COOKIE } from "@/lib/system-session";
import type { RowDataPacket } from "mysql2";

interface AppVersionRow extends RowDataPacket {
  platform: string;
  min_version: string;
  latest_version: string;
  store_url: string;
  updated_at: string;
}

const PLATFORMS = ["ios", "android"];

async function requireSystemAuth(req: NextRequest) {
  const token = req.cookies.get(SYSTEM_COOKIE)?.value;
  return !!token && (await verifySystemToken(token));
}

export async function GET(req: NextRequest) {
  if (!(await requireSystemAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await query<AppVersionRow>(
    "SELECT platform, min_version, latest_version, store_url, updated_at FROM app_versions ORDER BY platform",
    []
  );
  return NextResponse.json({ versions: rows });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireSystemAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { platform, min_version, latest_version, store_url } = body;

  if (!PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "platform은 ios 또는 android여야 합니다." }, { status: 400 });
  }
  if (!min_version?.trim() || !latest_version?.trim() || !store_url?.trim()) {
    return NextResponse.json({ error: "모든 값을 입력해주세요." }, { status: 400 });
  }

  await execute(
    `UPDATE app_versions SET min_version = ?, latest_version = ?, store_url = ?, updated_at = NOW()
     WHERE platform = ?`,
    [min_version.trim(), latest_version.trim(), store_url.trim(), platform]
  );

  return NextResponse.json({ success: true });
}
