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

interface Props {
  users: UserListItem[];
  locale: Locale;
  districts: Option[];
  admins: Option[];
  t: {
    columns: { status: string; nameId: string; age: string; district: string; contact: string; caseworker: string; lastCheck: string; };
    yearsSuffix: string;
    a11y: { call: string; more: string; };
  };
}

function InviteCodeCell({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).then(() => {
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
      {copied ? "복사됨" : "초대코드 복사"}
    </button>
  );
}

function ModalInviteCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <div className="rounded-lg bg-surface-muted px-4 py-3 flex items-center justify-between">
      <p className="text-xs text-muted">초대코드</p>
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-trust-700 bg-trust-50 hover:bg-trust-100 transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "복사됨" : "초대코드 복사"}
      </button>
    </div>
  );
}

export function UsersTable({ users, locale, districts, admins, t }: Props) {
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
                    <Badge tone="safe" className="mt-0.5 text-[10px]">앱가입완료</Badge>
                  ) : u.invite_code ? (
                    <InviteCodeCell code={u.invite_code} />
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
                    : <span className="text-xs text-muted">미배정</span>
                  }
                </TableCell>
                <TableCell>
                  {u.last_checkin_at ? (
                    <>
                      <div className="text-sm font-medium">{formatRelativeTime(u.last_checkin_at, locale)}</div>
                      <div className="text-xs text-subtle">{formatShortDateTime(u.last_checkin_at, locale)}</div>
                    </>
                  ) : (
                    <span className="text-xs text-muted">체크인 없음</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <Button size="icon" variant="ghost" aria-label={t.a11y.call}>
                      <Phone className="h-4 w-4 text-trust-700" />
                    </Button>
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
              <h2 className="text-base font-bold">대상자 정보 수정</h2>
              <button onClick={closeEdit} className="text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={save} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="e-name">이름 *</Label>
                  <Input id="e-name" name="name" placeholder="이름" value={form.name} onChange={handle} required />
                </div>
                <div>
                  <Label htmlFor="e-age">연령 *</Label>
                  <Input id="e-age" name="age" type="number" min={1} max={150} placeholder="연령" value={form.age} onChange={handle} required />
                </div>
              </div>

              <div>
                <Label htmlFor="e-district">관할구역</Label>
                <select id="e-district" name="district_id" value={form.district_id} onChange={handle}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500">
                  <option value="">구역 선택</option>
                  {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <Label htmlFor="e-address">주소</Label>
                <Input id="e-address" name="address" placeholder="주소" value={form.address} onChange={handle} />
              </div>

              <div>
                <Label htmlFor="e-phone">긴급연락처</Label>
                <Input id="e-phone" name="emergency_phone" inputMode="tel" placeholder="긴급연락처" value={form.emergency_phone} onChange={handle} />
              </div>

              <div>
                <Label htmlFor="e-admin">담당자</Label>
                <select id="e-admin" name="admin_id" value={form.admin_id} onChange={handle}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500">
                  <option value="">담당자 선택</option>
                  {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {editing.register_flag === 1 ? (
                <div className="rounded-lg bg-surface-muted px-4 py-3 text-xs text-muted">
                  앱 가입이 완료된 대상자입니다.
                </div>
              ) : editing.invite_code ? (
                <ModalInviteCodeButton code={editing.invite_code} />
              ) : null}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeEdit}>취소</Button>
                <Button type="submit" disabled={loading}>{loading ? "저장 중..." : "저장"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
