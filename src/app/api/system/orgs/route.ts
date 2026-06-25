import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifySystemToken, SYSTEM_COOKIE } from "@/lib/system-session";
import type { RowDataPacket } from "mysql2";

interface OrgRow extends RowDataPacket {
  org_id: number;
  name: string;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SYSTEM_COOKIE)?.value;
  if (!token || !(await verifySystemToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await query<OrgRow>(
    "SELECT org_id, name FROM organizations ORDER BY name ASC",
    [],
  );

  return NextResponse.json({ orgs: rows });
}
