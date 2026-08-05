import { redirect } from "next/navigation";
import { getSystemSession } from "@/lib/system-session";
import { AppVersionClient } from "./AppVersionClient";

export const metadata = { title: "앱 버전 관리" };

export default async function SystemAppVersionPage() {
  const ok = await getSystemSession();
  if (!ok) redirect("/system/login");

  return <AppVersionClient />;
}
