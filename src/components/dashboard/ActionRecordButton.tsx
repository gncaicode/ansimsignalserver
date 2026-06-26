"use client";

import { useState } from "react";
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatShortDateTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n";

interface ActionLog {
  log_id: number;
  action_type: string;
  note: string | null;
  created_at: string;
  admin_name: string | null;
}

export interface ActionModalT {
  title: string;
  typeLabel: string;
  types: { visit: string; call: string; sms: string; hospital: string; other: string };
  noteLabel: string;
  notePlaceholder: string;
  save: string;
  saving: string;
  cancel: string;
  successMsg: string;
  errorServer: string;
  history: string;
  noHistory: string;
  actor: string;
}

interface Props {
  userId: string;
  userName: string;
  btnLabel: string;
  btnA11y: string;
  t: ActionModalT;
  locale: Locale;
}

export function ActionRecordButton({ userId, userName, btnLabel, btnA11y, t, locale }: Props) {
  const [open, setOpen] = useState(false);
  const [actionType, setActionType] = useState("visit");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState<ActionLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function fetchHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/actions`);
      const data = await res.json();
      if (res.ok) setHistory(data.logs ?? []);
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  }

  async function openModal() {
    setActionType("visit");
    setNote("");
    setError("");
    setSuccess(false);
    setOpen(true);
    await fetchHistory();
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
      if (!res.ok) { setError(data.error || t.errorServer); return; }
      setSuccess(true);
      setNote("");
      await fetchHistory();
    } catch { setError(t.errorServer); }
    finally { setLoading(false); }
  }

  const typeEntries = Object.entries(t.types) as [keyof typeof t.types, string][];

  return (
    <>
      <Button size="sm" variant="ghost" aria-label={btnA11y} onClick={openModal}>
        <FileText className="h-4 w-4" />
        {btnLabel}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-bold">{t.title} — {userName}</h2>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 pb-6">

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t.typeLabel}</label>
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
                <label className="block text-sm font-medium mb-1">{t.noteLabel}</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.notePlaceholder}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500 resize-none"
                />
              </div>
            </div>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {success && <p className="mt-2 text-sm text-status-safe-fg">{t.successMsg}</p>}

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                {t.cancel}
              </Button>
              <Button onClick={submit} disabled={loading}>
                {loading ? t.saving : t.save}
              </Button>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <h3 className="text-sm font-semibold mb-3">{t.history}</h3>
              {historyLoading ? (
                <p className="text-sm text-muted py-2">...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted py-2">{t.noHistory}</p>
              ) : (
                <ul className="space-y-2">
                  {history.map((log) => (
                    <li key={log.log_id} className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {t.types[log.action_type as keyof typeof t.types] ?? log.action_type}
                        </span>
                        {log.note && (
                          <span className="text-sm text-muted truncate">{log.note}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-subtle">
                        {formatShortDateTime(log.created_at.replace(" ", "T") + "+09:00", locale)}
                        {log.admin_name ? ` · ${t.actor}: ${log.admin_name}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
