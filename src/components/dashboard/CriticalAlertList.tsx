import { MapPin, Phone, MessageSquare, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/brand/StatusBadge";
import { ActionRecordButton } from "@/components/dashboard/ActionRecordButton";
import type { ActionModalT } from "@/components/dashboard/ActionRecordButton";
import { ElapsedTimer } from "@/components/dashboard/ElapsedTimer";
import type { Subject } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type CriticalLabels = {
  header: string;
  headerDesc: string;
  summary: (d: number, w: number) => string;
  colElapsed: string;
  colContact: string;
  colCaseworker: string;
  btnCall: string;
  btnCallA11y: (name: string) => string;
  btnSms: string;
  btnSmsA11y: string;
  btnRecord: string;
  btnRecordA11y: string;
  yearsSuffix: string;
  genderM: string;
  genderF: string;
  actionModal: ActionModalT;
};

export function CriticalAlertList({
  subjects,
  locale,
  labels,
}: {
  subjects: Subject[];
  locale: Locale;
  labels: CriticalLabels;
}) {
  const dangers = subjects.filter((s) => s.status === "danger");
  const warns = subjects.filter((s) => s.status === "warn");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-status-danger-bg/50 border-b border-status-danger/20">
        <div>
          <CardTitle className="flex items-center gap-2 text-status-danger-fg">
            <AlertTriangle className="h-5 w-5 text-status-danger" />
            {labels.header}
          </CardTitle>
          <p className="mt-1 text-xs text-muted">{labels.headerDesc}</p>
        </div>
        <Badge tone="danger" className="text-sm">
          {labels.summary(dangers.length, warns.length)}
        </Badge>
      </CardHeader>

      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {[...dangers, ...warns].map((s) => (
            <AlertRow key={s.id} subject={s} locale={locale} labels={labels} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function AlertRow({
  subject: s,
  locale,
  labels,
}: {
  subject: Subject;
  locale: Locale;
  labels: CriticalLabels;
}) {
  const isDanger = s.status === "danger";
  const btnBase =
    "inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold h-8 px-3 transition-colors whitespace-nowrap focus-visible:outline-none";

  return (
    <li
      className={cn(
        "flex flex-col lg:flex-row lg:items-center gap-4 px-5 py-4",
        isDanger ? "bg-status-danger-bg/15" : "bg-white",
      )}
    >
      <div className="flex items-start gap-3 lg:min-w-[280px]">
        <div
          className={cn(
            "mt-0.5 h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold",
            isDanger
              ? "bg-status-danger text-white pulse-danger"
              : "bg-status-warn text-white",
          )}
        >
          {s.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={s.status} locale={locale} />
            <span className="text-base font-bold">{s.name}</span>
            <span className="text-sm text-muted">
              {s.gender === "F" ? labels.genderF : labels.genderM} · {s.age}
              {labels.yearsSuffix}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {s.district} · {s.addressDetail}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6 flex-1 min-w-0">
        <div className="lg:min-w-[160px]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
            {labels.colElapsed}
          </p>
          <p
            className={cn(
              "mt-0.5 text-sm font-bold",
              isDanger ? "text-status-danger" : "text-status-warn-fg",
            )}
          >
            <ElapsedTimer lastCheckIn={s.lastCheckIn} locale={locale} />
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
            {labels.colContact}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {s.emergencyContactPhone || "—"}
          </p>
        </div>

        <div className="lg:min-w-[100px] hidden xl:block">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
            {labels.colCaseworker}
          </p>
          <p className="mt-0.5 text-sm font-semibold">{s.caseworker}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:ml-auto">
        {/* 즉시 전화 */}
        <a
          href={`tel:${s.emergencyContactPhone}`}
          aria-label={labels.btnCallA11y(s.emergencyContactPhone)}
          className={cn(
            btnBase,
            isDanger
              ? "bg-status-danger text-white hover:bg-red-700"
              : "bg-trust-700 text-white hover:bg-trust-800",
          )}
        >
          <Phone className="h-4 w-4" />
          {labels.btnCall}
        </a>

        {/* 문자 */}
        <a
          href={`sms:${s.emergencyContactPhone}`}
          aria-label={labels.btnSmsA11y}
          className={cn(
            btnBase,
            "border border-border-strong bg-white text-foreground hover:bg-surface-muted",
          )}
        >
          <MessageSquare className="h-4 w-4" />
          {labels.btnSms}
        </a>

        {/* 조치 기록 */}
        <ActionRecordButton
          userId={s.id}
          userName={s.name}
          btnLabel={labels.btnRecord}
          btnA11y={labels.btnRecordA11y}
          t={labels.actionModal}
        />
      </div>
    </li>
  );
}
