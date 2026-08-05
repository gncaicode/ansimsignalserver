import { redirect } from "next/navigation";
import { getSystemSession } from "@/lib/system-session";
import { OrgsClient } from "./OrgsClient";

export const metadata = { title: "기관 관리" };

export default async function SystemOrgsPage() {
  const ok = await getSystemSession();
  if (!ok) redirect("/admin/login");

  return <OrgsClient />;
}
