"use client";

import { useRouter } from "next/navigation";
import { LogIn, ShieldAlert, LogOut, Smartphone } from "lucide-react";

export type SystemMenuKey = "access" | "personal" | "app-version";

interface SystemSidebarProps {
  active: SystemMenuKey;
  onSelectLogMenu?: (key: "access" | "personal") => void;
}

export function SystemSidebar({ active, onSelectLogMenu }: SystemSidebarProps) {
  const router = useRouter();

  function selectLogMenu(key: "access" | "personal") {
    if (onSelectLogMenu) onSelectLogMenu(key);
    else router.push(`/system/logs?menu=${key}`);
  }

  async function logout() {
    await fetch("/api/system/auth/logout", { method: "POST" });
    router.push("/system/login");
  }

  return (
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
          onClick={() => selectLogMenu("access")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            active === "access"
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <LogIn className="h-4 w-4 shrink-0" />
          접속 로그
        </button>
        <button
          onClick={() => selectLogMenu("personal")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            active === "personal"
              ? "bg-red-50 text-red-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <ShieldAlert className="h-4 w-4 shrink-0" />
          개인정보 접근 로그
        </button>

        <p className="px-2 pt-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">관리</p>
        <button
          onClick={() => router.push("/system/app-version")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            active === "app-version"
              ? "bg-trust-50 text-trust-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Smartphone className="h-4 w-4 shrink-0" />
          앱 버전 관리
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
  );
}
