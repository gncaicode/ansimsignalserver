"use client";

import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Option { id: number; name: string; }

interface T {
  title: string;
  name: string; namePlaceholder: string;
  age: string; agePlaceholder: string;
  district: string; districtPlaceholder: string;
  address: string; addressPlaceholder: string;
  phone: string; phonePlaceholder: string;
  admin: string; adminPlaceholder: string;
  cancel: string; submit: string; submitting: string;
  errorServer: string;
}

export function UserAddModal({
  districts, admins, btnLabel, t,
}: {
  districts: Option[];
  admins: Option[];
  btnLabel: string;
  t: T;
}) {
  const [open, setOpen] = useState(false);
  const EMPTY = { name: "", age: "", district_id: "", address: "", emergency_phone: "", admin_id: "" };

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function close() { setOpen(false); setForm(EMPTY); setError(""); }

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
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
      close();
      window.location.reload();
    } catch {
      setError(t.errorServer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="md" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        {btnLabel}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-bold">{t.title}</h2>
              <button onClick={close} className="text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name">{t.name}</Label>
                  <Input id="name" name="name" placeholder={t.namePlaceholder} value={form.name} onChange={handle} required />
                </div>
                <div>
                  <Label htmlFor="age">{t.age}</Label>
                  <Input id="age" name="age" type="number" min={1} max={150} placeholder={t.agePlaceholder} value={form.age} onChange={handle} required />
                </div>
              </div>

              <div>
                <Label htmlFor="district_id">{t.district}</Label>
                <select id="district_id" name="district_id" value={form.district_id} onChange={handle}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500">
                  <option value="">{t.districtPlaceholder}</option>
                  {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <Label htmlFor="address">{t.address}</Label>
                <Input id="address" name="address" placeholder={t.addressPlaceholder} value={form.address} onChange={handle} />
              </div>

              <div>
                <Label htmlFor="emergency_phone">{t.phone}</Label>
                <Input id="emergency_phone" name="emergency_phone" inputMode="tel" placeholder={t.phonePlaceholder} value={form.emergency_phone} onChange={handle} />
              </div>

              {/* 담당자 배정 비활성화 — 구역별 복지사 자동 연결로 대체
              <div>
                <Label htmlFor="admin_id">{t.admin}</Label>
                <select id="admin_id" name="admin_id" value={form.admin_id} onChange={handle}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500">
                  <option value="">{t.adminPlaceholder}</option>
                  {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              */}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={close}>{t.cancel}</Button>
                <Button type="submit" disabled={loading}>{loading ? t.submitting : t.submit}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
