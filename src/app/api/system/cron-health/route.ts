import { NextRequest, NextResponse } from "next/server";
import { stat, open } from "fs/promises";
import { verifySystemToken, SYSTEM_COOKIE } from "@/lib/system-session";

// EC2 crontab이 30분마다 curl 응답을 그대로 append하는 파일 (deployment 메모 참고).
// 항목마다 타임스탬프가 없어 파일 mtime을 "마지막 실행 시각"으로 사용한다.
const CRON_LOG_PATH = process.env.CRON_LOG_PATH || "/opt/monitoring/logs/ansimsignal-cron.log";
const STALE_THRESHOLD_MS = 45 * 60 * 1000; // 30분 주기 + 여유

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SYSTEM_COOKIE)?.value;
  if (!token || !(await verifySystemToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const st = await stat(CRON_LOG_PATH);
    const readSize = Math.min(st.size, 4096);
    const fh = await open(CRON_LOG_PATH, "r");
    const buf = Buffer.alloc(readSize);
    await fh.read(buf, 0, readSize, st.size - readSize);
    await fh.close();

    const matches = buf.toString("utf8").match(/\{"processed":\d+,"alerted":\d+,"statusLogged":\d+\}/g);
    const lastResult = matches && matches.length > 0 ? JSON.parse(matches[matches.length - 1]) : null;

    const ageMs = Date.now() - st.mtime.getTime();

    return NextResponse.json({
      lastRunAt: st.mtime.toISOString(),
      minutesAgo: Math.floor(ageMs / 60000),
      stale: ageMs > STALE_THRESHOLD_MS,
      lastResult,
    });
  } catch (err) {
    console.error("[GET /api/system/cron-health]", err);
    return NextResponse.json({ error: "크론 로그 파일을 읽을 수 없습니다." }, { status: 500 });
  }
}
