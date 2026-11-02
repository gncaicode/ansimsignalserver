"use client";

import { useEffect, useState } from "react";
import { Smartphone, Info } from "lucide-react";
import { SystemSidebar } from "@/components/system/SystemSidebar";

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
          <p className="mt-1 text-[11px] text-gray-400">
            설치된 앱 버전이 이 값보다 낮으면 강제 업데이트가 발생합니다. 이 값을 올려서 배포하세요.
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">최신 버전 (latest_version)</label>
          <input
            value={latestVersion}
            onChange={(e) => setLatestVersion(e.target.value)}
            placeholder="1.0.3"
            className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500"
          />
          <p className="mt-1 text-[11px] text-gray-400">
            참고용 표시 값입니다. 강제 업데이트 여부에는 영향을 주지 않습니다.
          </p>
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
        <p className="mt-1 text-[11px] text-gray-400">
          강제 업데이트 안내 다이얼로그에서 이 주소로 연결됩니다 (App Store / Play Store 상세 페이지).
        </p>
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

  function handleSaved(updated: VersionRow) {
    setRows((prev) => prev?.map((r) => (r.platform === updated.platform ? updated : r)) ?? null);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SystemSidebar active="app-version" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-base font-bold text-gray-900">앱 버전 관리</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            안심시그널 앱의 강제 업데이트 기준 버전과 스토어 링크를 관리합니다.
          </p>
        </header>

        <div className="p-6 max-w-2xl w-full space-y-4">
          <div className="flex gap-2.5 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-gray-700">
            <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-gray-900">강제 업데이트를 진행하는 방법</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>새 버전의 앱을 빌드해 App Store / Play Store에 배포하고, 심사가 끝나 실제로
                  다운로드 가능해질 때까지 기다립니다.</li>
                <li>아래 <strong>&quot;최신 버전(latest_version)&quot;</strong>을 방금 배포한 버전으로
                  갱신합니다 (참고용 표시 값 — 강제 여부에는 영향 없음).</li>
                <li>사용자를 그 버전으로 강제 이동시키고 싶은 시점에, <strong>&quot;최소 요구
                  버전(min_version)&quot;</strong>을 같은 버전으로 올려서 저장합니다.</li>
                <li>저장하는 즉시 적용됩니다. 앱을 다시 배포할 필요 없이, 설치된 모든 앱이 실행
                  시(스플래시 화면)마다 이 값을 조회해서 비교하기 때문입니다.</li>
                <li>설치된 버전이 min_version보다 낮으면 닫을 수 없는 업데이트 안내가 뜨고,
                  확인을 누르면 아래 &quot;스토어 URL&quot;로 이동합니다.</li>
              </ol>
              <p className="pt-1 border-t border-blue-100">
                <strong>주의:</strong> 아래 iOS/Android 카드는 완전히 독립적으로 저장됩니다 — 한
                플랫폼의 min_version을 올려도 다른 플랫폼에는 아무 영향이 없습니다. 그래서 굳이
                두 플랫폼을 동시에 맞출 필요는 없고, <strong>각 플랫폼은 그 스토어의 심사가 실제로
                끝나 앱을 받을 수 있게 된 뒤에만</strong> 그 플랫폼의 min_version을 올리면 됩니다.
                (예: iOS 심사만 먼저 끝났다면 iOS만 먼저 올리고, Android는 심사가 끝날 때까지
                그대로 두세요 — 스토어에 아직 없는 버전을 요구하면 그 플랫폼 사용자는 업데이트를
                할 수 없게 됩니다.)
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {rows === null && !error && <p className="text-sm text-gray-400">불러오는 중...</p>}
          {rows?.map((row) => (
            <PlatformCard key={row.platform} row={row} onSaved={handleSaved} />
          ))}
        </div>
      </div>
    </div>
  );
}
