import { Clock, AlertTriangle } from "lucide-react";
import type { OrgPlan } from "@/lib/org-plan";

const CONTACT_EMAIL = "gncai.contact@gmail.com";

interface Props {
  plan: OrgPlan;
  t: { trial: string; trialFull: string; trialExpired: string; contact: string };
}

function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""));
}

// 체험 중이거나 체험이 끝난 기관에만 화면 맨 위에 표시한다.
export function PlanBanner({ plan, t }: Props) {
  if (plan.status !== "trial" || plan.daysLeft === null) return null;

  const contact = (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold underline underline-offset-2 whitespace-nowrap">
      {t.contact}
    </a>
  );

  if (plan.trialExpired) {
    return (
      <div className="flex items-start gap-2 border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800 sm:px-6">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="leading-relaxed">{t.trialExpired} {contact}</p>
      </div>
    );
  }

  const limit = plan.userLimit ?? 0;
  const full = plan.userLimit != null && plan.userCount >= plan.userLimit;
  return (
    <div className="flex items-start gap-2 border-b border-trust-100 bg-trust-50 px-4 py-2.5 text-sm text-trust-800 sm:px-6">
      <Clock className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="leading-relaxed">
        {fill(t.trial, { days: plan.daysLeft, count: plan.userCount, limit })}
        {full && <> · {fill(t.trialFull, { limit })}</>}
        {" "}{contact}
      </p>
    </div>
  );
}
