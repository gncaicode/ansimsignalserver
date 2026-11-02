"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SystemSidebar } from "@/components/system/SystemSidebar";

type Alert = {
  log_id: number;
  changed_at: string;
  user_name: string;
  org_name: string | null;
  district_name: string | null;
};

export function AlertsClient() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [org, setOrg] = useState("");
  const [userName, setUserName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchAlerts = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (org) params.set("org", org);
      if (userName) params.set("userName", userName);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", String(p));

      const res = await fetch(`/api/system/alerts?${params}`);
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json();
      setAlerts(data.alerts ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [org, userName, dateFrom, dateTo, router]);

  useEffect(() => {
    fetchAlerts(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetFilters() {
    setOrg(""); setUserName(""); setDateFrom(""); setDateTo("");
  }

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SystemSidebar active="alerts" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-base font-bold text-gray-900">위급 알림 이력</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            대상자가 위급 상태로 전환되어 담당 복지사에게 알림 메일이 발송된 시점을 조회합니다.
          </p>
        </header>

        <div className="p-6 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="기관명"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="대상자명"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => fetchAlerts(1)}
                disabled={loading}
                className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? "조회 중..." : "조회"}
              </button>
              <button
                onClick={resetFilters}
                className="text-sm text-gray-600 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
              >
                초기화
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">총 <strong>{total.toLocaleString()}</strong>건</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">위급 전환 일시</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">기관</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">구역</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">대상자</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-gray-400">
                        {loading ? "조회 중..." : "데이터가 없습니다."}
                      </td>
                    </tr>
                  ) : (
                    alerts.map((a) => (
                      <tr key={a.log_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{a.changed_at}</td>
                        <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{a.org_name ?? "-"}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{a.district_name ?? "-"}</td>
                        <td className="px-4 py-3 text-gray-800 whitespace-nowrap font-medium">{a.user_name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => fetchAlerts(page - 1)}
                  disabled={page <= 1 || loading}
                  className="text-sm text-gray-600 border border-gray-300 rounded px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
                >
                  이전
                </button>
                <span className="text-sm text-gray-600">{page} / {totalPages}</span>
                <button
                  onClick={() => fetchAlerts(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="text-sm text-gray-600 border border-gray-300 rounded px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
