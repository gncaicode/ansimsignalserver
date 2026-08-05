"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { SystemSidebar } from "@/components/system/SystemSidebar";

interface OrgRow {
  org_id: number;
  name: string;
  admin_count: number;
  user_count: number;
}

export function OrgsClient() {
  const [orgs, setOrgs] = useState<OrgRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/system/orgs")
      .then((res) => res.json())
      .then((data) => {
        if (data.orgs) setOrgs(data.orgs);
        else setError(data.error || "불러오기에 실패했습니다.");
      })
      .catch(() => setError("서버와 통신할 수 없습니다."));
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SystemSidebar active="orgs" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-base font-bold text-gray-900">기관 관리</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            가입된 전체 기관과 소속 관리자·대상자 수를 조회합니다.
          </p>
        </header>

        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {orgs === null && !error && <p className="text-sm text-gray-400">불러오는 중...</p>}

          {orgs && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">기관명</th>
                    <th className="px-4 py-3 text-center">관리자 수</th>
                    <th className="px-4 py-3 text-center">대상자 수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orgs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                        등록된 기관이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    orgs.map((org) => (
                      <tr key={org.org_id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 font-medium text-gray-900">
                            <Building2 className="h-4 w-4 text-trust-700 shrink-0" />
                            {org.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">{org.admin_count}</td>
                        <td className="px-4 py-3 text-center">{org.user_count}</td>
                      </tr>
                    ))
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
