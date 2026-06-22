"use client";

import { useState } from "react";
import { Phone, Pencil, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/brand/StatusBadge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { formatRelativeTime, formatShortDateTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n";
import type { UserListItem } from "@/lib/dashboard-data";

interface Option { id: number; name: string; }

interface CommonT {
  noCheckin: string;
  unassigned: string;
  appJoined: string;
  appJoinedDesc: string;
  copyCode: string;
  copied: string;
  cancel: string;
  save: string;
  saving: string;
  editUserTitle: string;
}

interface Props {
  users: UserListItem[];
  locale: Locale;
  districts: Option[];
  admins: Option[];
  t: {
    columns: { status: string; nameId: string; age: string; district: string; contact: string; caseworker: string; lastCheck: string; };
    yearsSuffix: string;
    a11y: { call: string; more: string; };
    addModal: {
      title: string; name: string; namePlaceholder: string;
      age: string; agePlaceholder: string;
      district: string; districtPlaceholder: string;
      address: string; addressPlaceholder: string;
      phone: string; phonePlaceholder: string;
      admin: string; adminPlaceholder: string;
      cancel: string; save: string; saving: string;
      errorServer: string;
    };
  };
  common: CommonT;
}

function copyToClipboard(text: string, onSuccess: () => void) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(() => execCopy(text, onSuccess));
  } else {
    execCopy(text, onSuccess);
  }
}

function execCopy(text: string, onSuccess: () => void) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  try { document.execCommand("copy"); onSuccess(); } catch { /* silent */ }
  document.body.removeChild(el);
}

function InviteCodeCell({ code, copyCode, copied: copiedLabel }: { code: string; copyCode: string; copied: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    copyToClipboard(code, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={copy}
      className="mt-0.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-trust-700 bg-trust-50 hover:bg-trust-100 transition-colors"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? copiedLabel : copyCode}
    </button>
  );
}

function ModalInviteCodeButton({ code, copyCode, copied: copiedLabel }: { code: string; copyCode: string; copied: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    copyToClipboard(code, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <div className="rounded-lg bg-surface-muted px-4 py-3 flex items-center justify-between">
      <p className="text-xs text-muted">{copyCode}</p>
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-trust-700 bg-trust-50 hover:bg-trust-100 transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? copiedLabel : copyCode}
      </button>
    </div>
  );
}

export function UsersTable({ users, locale, districts, admins, t, common }: Props) {
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [form, setForm] = useState({ name: "", age: "", district_id: "", address: "", emergency_phone: "", admin_id: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function openEdit(u: UserListItem) {
    setEditing(u);
    setForm({
      name:            u.name,
      age:             String(u.age),
      district_id:     String(districts.find((d) => d.name === u.district_name)?.id ?? ""),
      address:         u.address,
      emergency_phone: u.emergency_phone,
      admin_id:        String(admins.find((a) => a.name === u.admin_name)?.id ?? ""),
    });
    setError("");
  }

  function closeEdit() {
    setEditing(null);
    setError("");
  }

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${editing.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:            form.name,
          age:             Number(form.age),
          district_id:     form.district_id || null,
          address:         form.address,
          emergency_phone: form.emergency_phone,
          admin_id:        form.admin_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      closeEdit();
      window.location.reload();
    } catch {
      setError("서버와 통신할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">{t.columns.status}</TableHead>
            <TableHead>{t.columns.nameId}</TableHead>
            <TableHead className="w-[60px] text-center">{t.columns.age}</TableHead>
            <TableHead>{t.columns.district}</TableHead>
            <TableHead>{t.columns.contact}</TableHead>
            <TableHead className="w-[100px]">{t.columns.caseworker}</TableHead>
            <TableHead className="w-[170px]">{t.columns.lastCheck}</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-12 text-center text-muted">
                등록된 대상자가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.user_id}>
                <TableCell>
                  <StatusBadge status={u.status} locale={locale} />
                </TableCell>
                <TableCell>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-subtle">#{u.user_id}</div>
                  {u.register_flag === 1 ? (
                    <Badge tone="safe" className="mt-0.5 text-[10px]">{common.appJoined}</Badge>
                  ) : u.invite_code ? (
                    <InviteCodeCell code={u.invite_code} copyCode={common.copyCode} copied={common.copied} />
                  ) : null}
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-semibold">{u.age}</span>
                  <span className="ml-0.5 text-xs text-subtle">{t.yearsSuffix}</span>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{u.district_name ?? "—"}</div>
                  <div className="text-xs text-muted truncate max-w-[260px]">{u.address}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{u.emergency_phone || "—"}</div>
                </TableCell>
                <TableCell>
                  {u.admin_name
                    ? <Badge tone="trust">{u.admin_name}</Badge>
                    : <span className="text-xs text-muted">{common.unassigned}</span>
                  }
                </TableCell>
                <TableCell>
                  {u.last_checkin_at ? (
                    <>
                      <div className="text-sm font-medium">{formatRelativeTime(u.last_checkin_at, locale)}</div>
                      <div className="text-xs text-subtle">{formatShortDateTime(u.last_checkin_at, locale)}</div>
                    </>
                  ) : (
                    <span className="text-xs text-muted">{common.noCheckin}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    {u.emergency_phone ? (
                      <a href={`tel:${u.emergency_phone}`} aria-label={t.a11y.call}>
                        <Button size="icon" variant="ghost">
                          <Phone className="h-4 w-4 text-trust-700" />
                        </Button>
                      </a>
                    ) : (
                      <Button size="icon" variant="ghost" disabled aria-label={t.a11y.call}>
                        <Phone className="h-4 w-4 text-subtle" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" aria-label="수정" onClick={() => openEdit(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* 수정 모달 */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeEdit} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-bold">{common.editUserTitle}</h2>
              <button onClick={closeEdit} className="text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={save} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="e-name">{t.addModal.name}</Label>
                  <Input id="e-name" name="name" placeholder={t.addModal.namePlaceholder} value={form.name} onChange={handle} required />
                </div>
                <div>
                  <Label htmlFor="e-age">{t.addModal.age}</Label>
                  <Input id="e-age" name="age" type="number" min={1} max={150} placeholder={t.addModal.agePlaceholder} value={form.age} onChange={handle} required />
                </div>
              </div>

              <div>
                <Label htmlFor="e-district">{t.addModal.district}</Label>
                <select id="e-district" name="district_id" value={form.district_id} onChange={handle}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500">
                  <option value="">{t.addModal.districtPlaceholder}</option>
                  {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <Label htmlFor="e-address">{t.addModal.address}</Label>
                <Input id="e-address" name="address" placeholder={t.addModal.addressPlaceholder} value={form.address} onChange={handle} />
              </div>

              <div>
                <Label htmlFor="e-phone">{t.addModal.phone}</Label>
                <Input id="e-phone" name="emergency_phone" inputMode="tel" placeholder={t.addModal.phonePlaceholder} value={form.emergency_phone} onChange={handle} />
              </div>

              <div>
                <Label htmlFor="e-admin">{t.addModal.admin}</Label>
                <select id="e-admin" name="admin_id" value={form.admin_id} onChange={handle}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500">
                  <option value="">{t.addModal.adminPlaceholder}</option>
                  {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {editing.register_flag === 1 ? (
                <div className="rounded-lg bg-surface-muted px-4 py-3 text-xs text-muted">
                  {common.appJoinedDesc}
                </div>
              ) : editing.invite_code ? (
                <ModalInviteCodeButton code={editing.invite_code} copyCode={common.copyCode} copied={common.copied} />
              ) : null}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeEdit}>{t.addModal.cancel}</Button>
                <Button type="submit" disabled={loading}>{loading ? t.addModal.saving : t.addModal.save}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
