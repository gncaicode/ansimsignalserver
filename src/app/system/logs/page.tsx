import { redirect } from "next/navigation";
import { getSystemSession } from "@/lib/system-session";
import { LogsClient } from "./LogsClient";

export const metadata = { title: "시스템 로그 조회" };

export default async function SystemLogsPage() {
  const ok = await getSystemSession();
  if (!ok) redirect("/system/login");

  return <LogsClient />;
}
