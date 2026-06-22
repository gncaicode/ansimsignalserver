"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface T {
  title: string;
  name: string; namePlaceholder: string;
  email: string; emailPlaceholder: string;
  password: string; passwordPlaceholder: string;
  phone: string; phonePlaceholder: string;
  position: string; positionPlaceholder: string;
  department: string; departmentPlaceholder: string;
  role: string; rolePlaceholder: string;
  cancel: string; submit: string; submitting: string;
  errorServer: string;
}

interface RoleOption { value: string; label: string; }

const EMPTY = { name: "", email: "", password: "", phone: "", position: "", department: "", role: "" };

export function ManagerAddModal({ btnLabel, t, roles }: { btnLabel: string; t: T; roles: RoleOption[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function submit() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.errorServer); return; }
      setOpen(false);
      setForm(EMPTY);
      window.location.reload();
    } catch { setError(t.errorServer); }
    finally { setLoading(false); }
  }

  return (
    <>
      <Button size="md" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        {btnLabel}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold">{t.title}</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t.name}</label>
                <Input name="name" value={form.name} onChange={handle} placeholder={t.namePlaceholder} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.email}</label>
                <Input name="email" type="email" value={form.email} onChange={handle} placeholder={t.emailPlaceholder} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.password}</label>
                <Input name="password" type="password" value={form.password} onChange={handle} placeholder={t.passwordPlaceholder} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.phone}</label>
                <Input name="phone" value={form.phone} onChange={handle} placeholder={t.phonePlaceholder} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.position}</label>
                  <Input name="position" value={form.position} onChange={handle} placeholder={t.positionPlaceholder} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.department}</label>
                  <Input name="department" value={form.department} onChange={handle} placeholder={t.departmentPlaceholder} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.role}</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handle}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500"
                >
                  <option value="">{t.rolePlaceholder}</option>
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>{t.cancel}</Button>
              <Button onClick={submit} disabled={loading}>{loading ? t.submitting : t.submit}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
