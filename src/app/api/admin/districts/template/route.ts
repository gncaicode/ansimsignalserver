import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const headers = [["구역명"]];
  const example = [["일동 1통"], ["일동 2통"]];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([...headers, ...example]);
  ws["!cols"] = [{ wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, "관할구역등록양식");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("관할구역_일괄등록_양식")}.xlsx`,
    },
  });
}
