"use client";

import { useEffect, useState } from "react";
import { Building2, Users, UserCog, ShieldAlert, TriangleAlert, Mail } from "lucide-react";
import { SystemSidebar } from "@/components/system/SystemSidebar";

interface Stats {
  orgCount: number;
  adminCount: number;
  users: {
    total: number;
    pending: number;
    danger: number;
    warn: number;
    safe: number;
  };
  alertsToday: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone?: "default" | "danger" | "warn";
}) {
  const toneClasses =
    tone === "danger"
      ? "bg-red-50 text-red-700"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700"
      : "bg-trust-50 text-trust-700";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 text-gray-500">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${toneClasses}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}

export function DashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/system/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError("서버와 통신할 수 없습니다."));
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SystemSidebar active="dashboard" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-base font-bold text-gray-900">전체 현황</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            전체 기관·대상자 현황을 한눈에 확인합니다.
          </p>
        </header>

        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!stats && !error && <p className="text-sm text-gray-400">불러오는 중...</p>}

          {stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon={Building2} label="전체 기관 수" value={stats.orgCount} />
                <StatCard icon={Users} label="전체 대상자 수" value={stats.users.total} />
                <StatCard icon={UserCog} label="전체 관리자 수" value={stats.adminCount} />
                <StatCard icon={ShieldAlert} label="위급 대상자" value={stats.users.danger} tone="danger" />
                <StatCard icon={TriangleAlert} label="주의 대상자" value={stats.users.warn} tone="warn" />
                <StatCard icon={Mail} label="오늘 발송된 위급 알림" value={stats.alertsToday} tone="danger" />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3">대상자 상태 분포</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                    <span className="text-gray-500">안전</span>
                    <span className="font-semibold text-gray-900">{stats.users.safe.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50">
                    <span className="text-amber-700">주의</span>
                    <span className="font-semibold text-amber-700">{stats.users.warn.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50">
                    <span className="text-red-700">위급</span>
                    <span className="font-semibold text-red-700">{stats.users.danger.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                    <span className="text-gray-500">앱 연동 대기</span>
                    <span className="font-semibold text-gray-900">{stats.users.pending.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
