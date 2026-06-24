"use client";

import { useState, useCallback } from "react";
import { FileText, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionLog } from "@/lib/dashboard-data";
import type { ActionModalT } from "@/components/dashboard/ActionRecordButton";
import type { Locale } from "@/lib/i18n";
import { formatShortDateTime } from "@/lib/i18n/format";

interface T {
  actionTitle: string;
  actionDesc: string;
  btnAddAction: string;
  noActionLog: string;
  actionTypes: Record<string, string>;
  actor: string;
  actionModal: ActionModalT;
}

interface Props {
  userId: string;
  userName: string;
  initialLogs: ActionLog[];
  locale: Locale;
  t: T;
}


export function ActionLogSection({ userId, userName, initialLogs, locale, t }: Props) {
  const [logs, setLogs] = useState<ActionLog[]>(initialLogs);
  const [open, setOpen] = useState(false);
  const [actionType, setActionType] = useState("visit");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/actions`);
      const data = await res.json();
      if (res.ok) setLogs(data.logs ?? []);
    } catch { /* silent */ }
  }, [userId]);

  function openModal() {
    setActionType("visit");
    setNote("");
    setError("");
    setSuccess(false);
    setOpen(true);
  }

  async function submit() {
    setError(""); setSuccess(false); setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_type: actionType, note }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.actionModal.errorServer); return; }
      setSuccess(true);
      setNote("");
      await fetchLogs();
    } catch { setError(t.actionModal.errorServer); }
    finally { setLoading(false); }
  }

  const typeEntries = Object.entries(t.actionModal.types) as [string, string][];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold">{t.actionTitle}</h2>
          <p className="text-xs text-muted mt-0.5">{t.actionDesc}</p>
        </div>
        <Button size="sm" onClick={openModal}>
          <Plus className="h-4 w-4" />
          {t.btnAddAction}
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-border">
          <FileText className="h-8 w-8 text-subtle mb-2" />
          <p className="text-sm text-muted">{t.noActionLog}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {logs.map((log) => (
            <li key={log.log_id} className="rounded-xl border border-border bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-trust-50 px-2 py-0.5 text-xs font-semibold text-trust-700">
                    {t.actionTypes[log.action_type] ?? log.action_type}
                  </span>
                  {log.admin_name && (
                    <span className="text-xs text-muted">
                      {t.actor}: {log.admin_name}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-subtle">
                  {formatShortDateTime(log.created_at.replace(" ", "T") + "+09:00", locale)}
                </span>
              </div>
              {log.note && (
                <p className="mt-1.5 text-sm text-foreground whitespace-pre-wrap">{log.note}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 추가 모달 */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-bold">{t.actionModal.title} — {userName}</h2>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t.actionModal.typeLabel}</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500"
                >
                  {typeEntries.map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.actionModal.noteLabel}</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.actionModal.notePlaceholder}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500 resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-status-safe-fg">{t.actionModal.successMsg}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                  {t.actionModal.cancel}
                </Button>
                <Button onClick={submit} disabled={loading}>
                  {loading ? t.actionModal.saving : t.actionModal.save}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
