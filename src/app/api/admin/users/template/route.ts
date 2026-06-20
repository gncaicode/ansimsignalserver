import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const headers = [["이름", "연령", "관할구역", "주소", "긴급연락처", "담당자"]];
  const example = [["홍길동", 75, "일동 1통", "서울시 강남구 테헤란로 1", "010-1234-5678", "김복지"]];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([...headers, ...example]);
  ws["!cols"] = [
    { wch: 12 }, { wch: 6 }, { wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "대상자등록양식");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("대상자_일괄등록_양식")}.xlsx`,
    },
  });
}
