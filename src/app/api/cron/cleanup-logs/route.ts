import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { affectedRows } = await execute(
    "DELETE FROM admin_access_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)",
    [],
  );

  return NextResponse.json({ ok: true, deleted: affectedRows });
}
