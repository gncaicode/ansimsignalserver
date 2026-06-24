"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function DashboardRefresher() {
  const router = useRouter();

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
