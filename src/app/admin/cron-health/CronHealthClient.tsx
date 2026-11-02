"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { SystemSidebar } from "@/components/system/SystemSidebar";

interface HealthData {
  lastRunAt: string;
  minutesAgo: number;
  stale: boolean;
  lastResult: { processed: number; alerted: number; statusLogged: number } | null;
}

export function CronHealthClient() {
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch("/api/system/cron-health")
      .then((res) => res.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("서버와 통신할 수 없습니다."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const lastRunText = data
    ? new Date(data.lastRunAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
    : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SystemSidebar active="cron-health" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">크론 상태</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              30분마다 실행되는 위급 알림 크론(/api/cron/alert)의 최근 실행 여부를 확인합니다.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </header>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {data && (
            <>
              <div
                className={`rounded-xl border p-5 flex items-center gap-4 ${
                  data.stale ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                }`}
              >
                {data.stale ? (
                  <AlertTriangle className="h-8 w-8 text-red-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-bold ${data.stale ? "text-red-700" : "text-green-700"}`}>
                    {data.stale ? "크론이 지연되고 있습니다" : "정상 실행 중"}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    마지막 실행: {lastRunText} ({data.minutesAgo}분 전)
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3">최근 실행 결과</h2>
                {data.lastResult ? (
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="px-3 py-2 rounded-lg bg-gray-50">
                      <p className="text-gray-500 text-xs">처리 대상</p>
                      <p className="font-semibold text-gray-900 mt-1">{data.lastResult.processed}건</p>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-gray-50">
                      <p className="text-gray-500 text-xs">알림 발송</p>
                      <p className="font-semibold text-gray-900 mt-1">{data.lastResult.alerted}건</p>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-gray-50">
                      <p className="text-gray-500 text-xs">상태 변경 기록</p>
                      <p className="font-semibold text-gray-900 mt-1">{data.lastResult.statusLogged}건</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">최근 실행 결과를 파싱하지 못했습니다.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
