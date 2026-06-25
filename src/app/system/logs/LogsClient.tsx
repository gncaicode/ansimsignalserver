"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Log = {
  log_id: number;
  created_at: string;
  action: string;
  resource: string | null;
  ip_address: string | null;
  email: string | null;
  admin_name: string | null;
  admin_role: string | null;
  org_name: string | null;
};

const ACTION_LABELS: Record<string, string> = {
  login_success: "로그인 성공",
  login_fail: "로그인 실패",
  logout: "로그아웃",
  view_dashboard: "대시보드 조회",
  view_users: "대상자 목록 조회",
  view_user: "대상자 상세 조회",
  view_managers: "관리자 조회",
  view_reports: "리포트 조회",
  view_settings: "설정 조회",
  create_user: "대상자 등록",
  edit_user: "대상자 수정",
  delete_user: "대상자 삭제",
  export_users: "대상자 내보내기",
};

const ACTION_TYPES = [
  { value: "", label: "전체" },
  { value: "login_success", label: "로그인 성공" },
  { value: "login_fail", label: "로그인 실패" },
  { value: "logout", label: "로그아웃" },
  { value: "view_dashboard", label: "대시보드 조회" },
  { value: "view_users", label: "대상자 목록 조회" },
  { value: "view_user", label: "대상자 상세 조회" },
  { value: "view_managers", label: "관리자 조회" },
  { value: "view_reports", label: "리포트 조회" },
  { value: "view_settings", label: "설정 조회" },
  { value: "create_user", label: "대상자 등록" },
  { value: "edit_user", label: "대상자 수정" },
  { value: "delete_user", label: "대상자 삭제" },
  { value: "export_users", label: "대상자 내보내기" },
];

function actionBadge(action: string) {
  const label = ACTION_LABELS[action] ?? action;
  const isPersonal = ["create_user", "edit_user", "delete_user", "export_users"].includes(action);
  const isAuth = ["login_success", "login_fail", "logout"].includes(action);
  const cls = isPersonal
    ? "bg-red-100 text-red-700"
    : isAuth
    ? "bg-blue-100 text-blue-700"
    : "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export function LogsClient() {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [org, setOrg] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [adminName, setAdminName] = useState("");

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (org) params.set("org", org);
      if (action) params.set("action", action);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (adminName) params.set("adminName", adminName);
      params.set("page", String(p));

      const res = await fetch(`/api/system/logs?${params}`);
      if (res.status === 401) {
        router.push("/system/login");
        return;
      }
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [org, action, dateFrom, dateTo, adminName, router]);

  useEffect(() => {
    fetchLogs(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await fetch("/api/system/auth/logout", { method: "POST" });
    router.push("/system/login");
  }

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">시스템 로그 조회</h1>
          <p className="text-xs text-gray-500">모든 기관의 접속 로그 및 개인정보 접근 로그</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5"
        >
          로그아웃
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {/* 필터 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="기관명"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACTION_TYPES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
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
            <input
              type="text"
              placeholder="관리자 이름"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => fetchLogs(1)}
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "조회 중..." : "조회"}
            </button>
            <button
              onClick={() => {
                setOrg(""); setAction(""); setDateFrom(""); setDateTo(""); setAdminName("");
              }}
              className="text-sm text-gray-600 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 결과 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-600">총 <strong>{total.toLocaleString()}</strong>건</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">일시</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">기관</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">관리자</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">역할</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">이메일</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">액션</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">대상</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      {loading ? "조회 중..." : "데이터가 없습니다."}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{log.created_at}</td>
                      <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{log.org_name ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{log.admin_name ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{log.admin_role ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{log.email ?? "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{actionBadge(log.action)}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs max-w-[160px] truncate">{log.resource ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{log.ip_address ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1 || loading}
                className="text-sm text-gray-600 border border-gray-300 rounded px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
              >
                이전
              </button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button
                onClick={() => fetchLogs(page + 1)}
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
  );
}
