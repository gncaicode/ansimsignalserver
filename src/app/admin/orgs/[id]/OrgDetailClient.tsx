"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, UserCog, Clock3 } from "lucide-react";
import { SystemSidebar } from "@/components/system/SystemSidebar";

interface OrgDetail {
  org: {
    org_id: number;
    name: string;
    default_checkin_mode: string | null;
    default_interval_hours: number | null;
  };
  districts: { dist_id: number; name: string; user_count: number }[];
  admins: {
    admin_id: number;
    name: string;
    email: string;
    role: string;
    position: string | null;
    department: string | null;
    active_flag: number;
  }[];
  recentActivity: {
    log_id: number;
    created_at: string;
    action: string;
    resource: string | null;
    admin_name: string | null;
  }[];
}

const ROLE_LABEL: Record<string, string> = {
  superadmin: "최고관리자",
  admin: "관리자",
  social_worker: "복지사",
  viewer: "조회전용",
};

const CHECKIN_MODE_LABEL: Record<string, string> = {
  manual: "수동 체크인",
  appOpen: "앱 실행 시 자동",
  passive: "백그라운드 자동",
};

export function OrgDetailClient({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [data, setData] = useState<OrgDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/system/orgs/${orgId}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("서버와 통신할 수 없습니다."));
  }, [orgId]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SystemSidebar active="orgs" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <button
            onClick={() => router.push("/admin/orgs")}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            기관 목록으로
          </button>
          <h1 className="text-base font-bold text-gray-900">{data?.org.name ?? "기관 상세"}</h1>
        </header>

        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!data && !error && <p className="text-sm text-gray-400">불러오는 중...</p>}

          {data && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3">기본 설정</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="px-3 py-2 rounded-lg bg-gray-50">
                    <p className="text-gray-500 text-xs">기본 체크인 방식</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {data.org.default_checkin_mode
                        ? CHECKIN_MODE_LABEL[data.org.default_checkin_mode] ?? data.org.default_checkin_mode
                        : "-"}
                    </p>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-gray-50">
                    <p className="text-gray-500 text-xs">기본 체크인 주기</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {data.org.default_interval_hours ? `${data.org.default_interval_hours}시간` : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-trust-700" />
                  <h2 className="text-sm font-bold text-gray-900">구역 ({data.districts.length})</h2>
                </div>
                {data.districts.length === 0 ? (
                  <p className="text-sm text-gray-400">등록된 구역이 없습니다.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {data.districts.map((d) => (
                      <div key={d.dist_id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-sm">
                        <span className="text-gray-800">{d.name}</span>
                        <span className="text-gray-500 text-xs">{d.user_count}명</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-trust-700" />
                  <h2 className="text-sm font-bold text-gray-900">관리자 계정 ({data.admins.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">이름</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">역할</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">이메일</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">직책/부서</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.admins.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-gray-400">등록된 관리자가 없습니다.</td></tr>
                      ) : (
                        data.admins.map((a) => (
                          <tr key={a.admin_id} className="hover:bg-gray-50/60">
                            <td className="px-4 py-2.5 font-medium text-gray-900">{a.name}</td>
                            <td className="px-4 py-2.5 text-gray-600">{ROLE_LABEL[a.role] ?? a.role}</td>
                            <td className="px-4 py-2.5 text-gray-600 text-xs">{a.email}</td>
                            <td className="px-4 py-2.5 text-gray-600 text-xs">
                              {[a.position, a.department].filter(Boolean).join(" · ") || "-"}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                a.active_flag ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                              }`}>
                                {a.active_flag ? "활성" : "비활성"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-trust-700" />
                  <h2 className="text-sm font-bold text-gray-900">최근 활동</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {data.recentActivity.length === 0 ? (
                        <tr><td className="text-center py-8 text-gray-400">활동 기록이 없습니다.</td></tr>
                      ) : (
                        data.recentActivity.map((l) => (
                          <tr key={l.log_id} className="hover:bg-gray-50/60">
                            <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{l.created_at}</td>
                            <td className="px-4 py-2.5 text-gray-800 whitespace-nowrap">{l.admin_name ?? "-"}</td>
                            <td className="px-4 py-2.5 text-gray-600">{l.action}</td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs truncate max-w-[200px]">{l.resource ?? "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
