"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RoleOption { value: string; label: string; }

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
  errorServer: string; successMsg: string;
}

const selectCls = "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500";

const EMPTY = { name: "", email: "", password: "", phone: "", position: "", department: "", role: "" };

export function ManagerAddForm({
  roles, t, lang,
}: {
  roles: RoleOption[];
  t: T;
  lang: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.errorServer); return; }
      router.push(`/${lang}/managers`);
    } catch {
      setError(t.errorServer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="name">{t.name}</Label>
              <Input id="name" name="name" placeholder={t.namePlaceholder} value={form.name} onChange={handle} required />
            </div>

            <div>
              <Label htmlFor="email">{t.email}</Label>
              <Input id="email" name="email" type="email" placeholder={t.emailPlaceholder} value={form.email} onChange={handle} required />
            </div>

            <div>
              <Label htmlFor="password">{t.password}</Label>
              <Input id="password" name="password" type="password" placeholder={t.passwordPlaceholder} value={form.password} onChange={handle} required />
            </div>

            <div>
              <Label htmlFor="phone">{t.phone}</Label>
              <Input id="phone" name="phone" inputMode="tel" placeholder={t.phonePlaceholder} value={form.phone} onChange={handle} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="position">{t.position}</Label>
                <Input id="position" name="position" placeholder={t.positionPlaceholder} value={form.position} onChange={handle} />
              </div>
              <div>
                <Label htmlFor="department">{t.department}</Label>
                <Input id="department" name="department" placeholder={t.departmentPlaceholder} value={form.department} onChange={handle} />
              </div>
            </div>

            <div>
              <Label htmlFor="role">{t.role}</Label>
              <select id="role" name="role" value={form.role} onChange={handle} className={selectCls} required>
                <option value="">{t.rolePlaceholder}</option>
                {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/${lang}/managers`)}>
                {t.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t.submitting : t.submit}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
