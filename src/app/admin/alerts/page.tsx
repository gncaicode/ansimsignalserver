import { redirect } from "next/navigation";
import { getSystemSession } from "@/lib/system-session";
import { AlertsClient } from "./AlertsClient";

export const metadata = { title: "위급 알림 이력" };

export default async function SystemAlertsPage() {
  const ok = await getSystemSession();
  if (!ok) redirect("/admin/login");

  return <AlertsClient />;
}
