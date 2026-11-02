import { redirect } from "next/navigation";
import { getSystemSession } from "@/lib/system-session";
import { DashboardClient } from "./DashboardClient";

export const metadata = { title: "전체 현황" };

export default async function SystemDashboardPage() {
  const ok = await getSystemSession();
  if (!ok) redirect("/admin/login");

  return <DashboardClient />;
}
