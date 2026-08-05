import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface AppVersionRow extends RowDataPacket {
  min_version: string;
  latest_version: string;
  store_url: string;
}

const PLATFORMS = ["ios", "android"];

// 앱 강제 업데이트 정보 조회 — 인증 불필요(개인정보 없는 공개 정보)
export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform");
  if (!platform || !PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "platform은 ios 또는 android여야 합니다." }, { status: 400 });
  }

  const { rows } = await query<AppVersionRow>(
    "SELECT min_version, latest_version, store_url FROM app_versions WHERE platform = ?",
    [platform]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "버전 정보가 없습니다." }, { status: 404 });
  }

  const { min_version, latest_version, store_url } = rows[0];
  return NextResponse.json({ min_version, latest_version, store_url });
}
