"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function DashboardRefresher({ logAction }: { logAction?: "view_dashboard" } = {}) {
  const router = useRouter();

  useEffect(() => {
    // 탭 진입(마운트) 시 1회만 접속 기록 — router.refresh()로는 재실행되지 않음.
    // 이 컴포넌트는 여러 화면에서 공용으로 쓰이므로 logAction을 넘긴 화면에서만 기록한다.
    if (!logAction) return;
    fetch("/api/admin/dashboard-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: logAction }),
    }).catch(() => {});
  }, [logAction]);

  useEffect(() => {
    // SSE: 체크인 발생 즉시 갱신
    const es = new EventSource("/api/admin/events");
    es.onmessage = () => router.refresh();

    // 60초 폴링: SSE 연결 실패 또는 다른 변경사항을 위한 백업
    const poll = setInterval(() => router.refresh(), 60_000);

    return () => {
      es.close();
      clearInterval(poll);
    };
  }, [router]);

  return null;
}
