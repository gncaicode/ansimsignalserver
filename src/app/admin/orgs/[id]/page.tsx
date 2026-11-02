import { redirect } from "next/navigation";
import { getSystemSession } from "@/lib/system-session";
import { OrgDetailClient } from "./OrgDetailClient";

export const metadata = { title: "기관 상세" };

export default async function SystemOrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ok = await getSystemSession();
  if (!ok) redirect("/admin/login");

  const { id } = await params;

  return <OrgDetailClient orgId={id} />;
}
