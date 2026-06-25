"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogIn, ShieldAlert, LogOut } from "lucide-react";

type Org = { org_id: number; name: string };

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

type MenuKey = "access" | "personal";

const ACCESS_ACTIONS = [
  "login_success", "login_fail", "logout",
  "view_dashboard", "view_users", "view_user",
  "view_managers", "view_reports", "view_settings",
];
const PERSONAL_ACTIONS = ["create_user", "edit_user", "delete_user", "export_users"];

const ACTION_LABELS: Record<string, string> = {
  login_success:  "로그인 성공",
  login_fail:     "로그인 실패",
  logout:         "로그아웃",
  view_dashboard: "대시보드 조회",
  view_users:     "대상자 목록 조회",
  view_user:      "대상자 상세 조회",
  view_managers:  "관리자 조회",
  view_reports:   "리포트 조회",
  view_settings:  "설정 조회",
  create_user:    "대상자 등록",
  edit_user:      "대상자 수정",
  delete_user:    "대상자 삭제",
  export_users:   "대상자 내보내기",
};

const MENU_CONFIG: Record<MenuKey, { label: string; actions: string[]; color: string }> = {
  access: {
    label: "접속 로그",
    actions: ACCESS_ACTIONS,
    color: "bg-blue-100 text-blue-700",
  },
  personal: {
    label: "개인정보 접근 로그",
    actions: PERSONAL_ACTIONS,
    color: "bg-red-100 text-red-700",
  },
};

function actionBadge(action: string) {
  const label = ACTION_LABELS[action] ?? action;
  const isPersonal = PERSONAL_ACTIONS.includes(action);
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
  const [menu, setMenu] = useState<MenuKey>("access");
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);

  const [org, setOrg] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [adminName, setAdminName] = useState("");

  const fetchLogs = useCallback(async (p = 1, menuKey: MenuKey = menu) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (org) params.set("org", org);
      if (action) params.set("action", action);
      else params.set("actionGroup", menuKey);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (adminName) params.set("adminName", adminName);
      params.set("page", String(p));

      const res = await fetch(`/api/system/logs?${params}`);
      if (res.status === 401) { router.push("/system/login"); return; }
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [org, action, dateFrom, dateTo, adminName, router, menu]);

  useEffect(() => {
    fetch("/api/system/orgs")
      .then((r) => r.json())
      .then((d) => setOrgs(d.orgs ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setAction("");
    fetchLogs(1, menu);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu]);

  async function logout() {
    await fetch("/api/system/auth/logout", { method: "POST" });
    router.push("/system/login");
  }

  function resetFilters() {
    setOrg(""); setAction(""); setDateFrom(""); setDateTo(""); setAdminName("");
  }

  const totalPages = Math.max(1, Math.ceil(total / 50));
  const currentMenu = MENU_CONFIG[menu];
  const actionOptions = [{ value: "", label: "전체" }, ...currentMenu.actions.map(a => ({ value: a, label: ACTION_LABELS[a] }))];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* 로고 */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-trust-700">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" aria-hidden="true">
                <path d="M12 2.5 4 5.2v6.1c0 4.7 3.4 8.7 8 10.2 4.6-1.5 8-5.5 8-10.2V5.2L12 2.5Z" fill="currentColor" opacity="0.95" />
                <path d="M9.5 12.5h2l1-2.5 2 5 1-2.5h2" stroke="#16A34A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="leading-tight">
              <div className="text-[13px] font-extrabold tracking-tight text-trust-700">안심시그널</div>
              <div className="text-[10px] font-medium tracking-widest text-gray-400">SYSTEM</div>
            </div>
          </div>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">로그 조회</p>
          <button
            onClick={() => setMenu("access")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              menu === "access"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <LogIn className="h-4 w-4 shrink-0" />
            접속 로그
          </button>
          <button
            onClick={() => setMenu("personal")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              menu === "personal"
                ? "bg-red-50 text-red-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <ShieldAlert className="h-4 w-4 shrink-0" />
            개인정보 접근 로그
          </button>
        </nav>

        {/* 로그아웃 */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 상단 헤더 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-base font-bold text-gray-900">{currentMenu.label}</h1>
          <p className="text-xs text-gray-500 mt-0.5">모든 기관의 {currentMenu.label}를 조회합니다.</p>
        </header>

        <div className="p-6 space-y-4">
          {/* 필터 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <select
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체 기관</option>
                {orgs.map((o) => (
                  <option key={o.org_id} value={o.name}>{o.name}</option>
                ))}
              </select>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {actionOptions.map((a) => (
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
                onClick={resetFilters}
                className="text-sm text-gray-600 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
              >
                초기화
              </button>
            </div>
          </div>

          {/* 테이블 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
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
    </div>
  );
}
