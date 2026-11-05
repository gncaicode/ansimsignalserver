"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { SystemSidebar } from "@/components/system/SystemSidebar";

interface OrgRow {
  org_id: number;
  name: string;
  created_at: string;
  plan_status: "trial" | "active" | "suspended";
  trial_ends_at: string | null;
  user_limit: number | null;
  verified_at: string | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_email_verified: number | null;
  admin_count: number;
  user_count: number;
}

type Action = "verify" | "extend" | "activate" | "suspend" | "resume";

// DB 시각은 KST 문자열 — 날짜 부분만 보여주고, 남은 일수는 KST로 해석해 계산한다.
function daysUntil(kst: string): number {
  const end = new Date(kst.replace(" ", "T") + "+09:00").getTime();
  return Math.ceil((end - Date.now()) / 86_400_000);
}

function StatusBadge({ org }: { org: OrgRow }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap";
  if (org.plan_status === "suspended") return <span className={`${base} bg-gray-200 text-gray-700`}>정지</span>;
  if (org.plan_status === "active") return <span className={`${base} bg-green-100 text-green-700`}>정식</span>;
  if (!org.trial_ends_at) return <span className={`${base} bg-amber-100 text-amber-700`}>체험 · 메일 미인증</span>;
  const left = daysUntil(org.trial_ends_at);
  return left > 0
    ? <span className={`${base} bg-blue-100 text-blue-700`}>체험 · {left}일 남음</span>
    : <span className={`${base} bg-red-100 text-red-700`}>체험 종료</span>;
}

export function OrgsClient() {
  const [orgs, setOrgs] = useState<OrgRow[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch("/api/system/orgs")
      .then((res) => res.json())
      .then((data) => {
        if (data.orgs) setOrgs(data.orgs);
        else setError(data.error || "불러오기에 실패했습니다.");
      })
      .catch(() => setError("서버와 통신할 수 없습니다."));
  }, []);

  useEffect(load, [load]);

  async function run(org: OrgRow, action: Action) {
    const body: Record<string, unknown> = { action };
    if (action === "activate") {
      const input = window.prompt(
        `${org.name}을(를) 정식(무상)으로 전환합니다.\n대상자 상한을 입력하세요. 비워 두면 제한이 없습니다.`,
        org.user_limit ? String(org.user_limit) : "",
      );
      if (input === null) return;
      body.user_limit = input.trim() === "" ? null : Number(input.trim());
    }
    if (action === "suspend" && !window.confirm(
      `${org.name}의 이용을 정지합니다. 소속 운영자는 로그인할 수 없게 됩니다.\n대상자 안부 확인과 위급 알림은 계속 동작합니다.`,
    )) return;

    setBusyId(org.org_id);
    setError("");
    try {
      const res = await fetch(`/api/system/orgs/${org.org_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "처리하지 못했습니다.");
      load();
    } catch {
      setError("서버와 통신할 수 없습니다.");
    } finally {
      setBusyId(null);
    }
  }

  const btn = "rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SystemSidebar active="orgs" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-base font-bold text-gray-900">기관 관리</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            가입한 기관의 이용 상태를 확인하고, 기관 확인·체험 연장·정식 전환·정지를 처리합니다.
          </p>
        </header>

        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {orgs === null && !error && <p className="text-sm text-gray-400">불러오는 중...</p>}

          {orgs && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">기관명</th>
                    <th className="px-4 py-3">최고관리자</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3 text-center">대상자</th>
                    <th className="px-4 py-3 text-center">관리자</th>
                    <th className="px-4 py-3">기관 확인</th>
                    <th className="px-4 py-3">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orgs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        등록된 기관이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    orgs.map((org) => {
                      const busy = busyId === org.org_id;
                      return (
                        <tr key={org.org_id} className="hover:bg-gray-50/60 align-top">
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/orgs/${org.org_id}`}
                              className="flex items-center gap-2 font-medium text-gray-900 hover:text-trust-700 hover:underline"
                            >
                              <Building2 className="h-4 w-4 text-trust-700 shrink-0" />
                              {org.name}
                              <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                            </Link>
                            <div className="mt-0.5 pl-6 text-xs text-gray-400">가입 {org.created_at.slice(0, 10)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-900">{org.owner_name ?? "-"}</div>
                            <div className="text-xs text-gray-500">
                              {org.owner_email ?? ""}
                              {org.owner_email && !org.owner_email_verified && (
                                <span className="ml-1 text-amber-600">(메일 미인증)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge org={org} />
                            {org.plan_status === "trial" && org.trial_ends_at && (
                              <div className="mt-1 text-xs text-gray-400">~ {org.trial_ends_at.slice(0, 10)}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {org.user_count}
                            <span className="text-gray-400"> / {org.user_limit ?? "무제한"}</span>
                          </td>
                          <td className="px-4 py-3 text-center">{org.admin_count}</td>
                          <td className="px-4 py-3">
                            {org.verified_at ? (
                              <span className="text-xs text-green-700">확인 {org.verified_at.slice(0, 10)}</span>
                            ) : (
                              <button className={btn} disabled={busy} onClick={() => run(org, "verify")}>
                                기관 확인
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {org.plan_status === "trial" && (
                                <button className={btn} disabled={busy} onClick={() => run(org, "extend")}>
                                  체험 30일 연장
                                </button>
                              )}
                              {org.plan_status !== "suspended" && (
                                <button
                                  className={btn}
                                  disabled={busy || !org.verified_at}
                                  title={org.verified_at ? undefined : "기관 확인 후 전환할 수 있습니다"}
                                  onClick={() => run(org, "activate")}
                                >
                                  {org.plan_status === "active" ? "상한 변경" : "정식 전환"}
                                </button>
                              )}
                              {org.plan_status === "suspended" ? (
                                <button className={btn} disabled={busy} onClick={() => run(org, "resume")}>
                                  정지 해제
                                </button>
                              ) : (
                                <button
                                  className={`${btn} text-red-600`}
                                  disabled={busy}
                                  onClick={() => run(org, "suspend")}
                                >
                                  정지
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
