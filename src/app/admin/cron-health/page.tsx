import { redirect } from "next/navigation";
import { getSystemSession } from "@/lib/system-session";
import { CronHealthClient } from "./CronHealthClient";

export const metadata = { title: "크론 상태" };

export default async function SystemCronHealthPage() {
  const ok = await getSystemSession();
  if (!ok) redirect("/admin/login");

  return <CronHealthClient />;
}
