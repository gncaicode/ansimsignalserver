"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, LogOut, ArrowLeft } from "lucide-react";

type Platform = "ios" | "android";

interface VersionRow {
  platform: Platform;
  min_version: string;
  latest_version: string;
  store_url: string;
  updated_at: string;
}

const PLATFORM_LABEL: Record<Platform, string> = { ios: "iOS", android: "Android" };

function PlatformCard({ row, onSaved }: { row: VersionRow; onSaved: (row: VersionRow) => void }) {
  const [minVersion, setMinVersion] = useState(row.min_version);
  const [latestVersion, setLatestVersion] = useState(row.latest_version);
  const [storeUrl, setStoreUrl] = useState(row.store_url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function save() {
    setError(""); setSuccess(false); setLoading(true);
    try {
      const res = await fetch("/api/system/app-version", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: row.platform,
          min_version: minVersion,
          latest_version: latestVersion,
          store_url: storeUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "저장에 실패했습니다."); return; }
      setSuccess(true);
      onSaved({ ...row, min_version: minVersion, latest_version: latestVersion, store_url: storeUrl });
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("서버와 통신할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-trust-700" />
        <h2 className="text-sm font-bold text-gray-900">{PLATFORM_LABEL[row.platform]}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">최소 요구 버전 (min_version)</label>
          <input
            value={minVersion}
            onChange={(e) => setMinVersion(e.target.value)}
            placeholder="1.0.3"
            className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">최신 버전 (latest_version)</label>
          <input
            value={latestVersion}
            onChange={(e) => setLatestVersion(e.target.value)}
            placeholder="1.0.3"
            className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">스토어 URL</label>
        <input
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          placeholder="https://..."
          className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500"
        />
      </div>

      <p className="text-[11px] text-gray-400">마지막 수정: {row.updated_at}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-status-safe-fg">저장되었습니다.</p>}

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={loading || !minVersion.trim() || !latestVersion.trim() || !storeUrl.trim()}
          className="inline-flex items-center justify-center rounded-lg bg-trust-700 px-4 py-2 text-sm font-semibold text-white hover:bg-trust-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

export function AppVersionClient() {
  const router = useRouter();
  const [rows, setRows] = useState<VersionRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/system/app-version")
      .then((res) => res.json())
      .then((data) => {
        if (data.versions) setRows(data.versions);
        else setError(data.error || "불러오기에 실패했습니다.");
      })
      .catch(() => setError("서버와 통신할 수 없습니다."));
  }, []);

  async function logout() {
    await fetch("/api/system/auth/logout", { method: "POST" });
    router.push("/system/login");
  }

  function handleSaved(updated: VersionRow) {
    setRows((prev) => prev?.map((r) => (r.platform === updated.platform ? updated : r)) ?? null);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/system/logs")}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            시스템 로그 조회로
          </button>
          <h1 className="text-base font-bold text-gray-900">앱 버전 관리</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            안심시그널 앱의 강제 업데이트 기준 버전과 스토어 링크를 관리합니다.
          </p>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </header>

      <div className="p-6 max-w-2xl w-full mx-auto space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {rows === null && !error && <p className="text-sm text-gray-400">불러오는 중...</p>}
        {rows?.map((row) => (
          <PlatformCard key={row.platform} row={row} onSaved={handleSaved} />
        ))}
      </div>
    </div>
  );
}
