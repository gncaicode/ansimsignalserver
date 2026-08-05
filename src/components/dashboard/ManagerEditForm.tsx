"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RoleOption { value: string; label: string; }
interface DistrictOption { id: number; name: string; }

interface T {
  title: string;
  name: string; namePlaceholder: string;
  email: string;
  phone: string; phonePlaceholder: string;
  position: string; positionPlaceholder: string;
  department: string; departmentPlaceholder: string;
  role: string; rolePlaceholder: string;
  districtLabel: string; districtEmpty: string;
  save: string; saving: string; cancel: string;
  errorServer: string;
  deleteBtn: string;
  deleteConfirmTitle: string; deleteConfirmBody: string;
  deleteConfirmBtn: string; deleting: string; deleteCancelBtn: string;
}

const selectCls = "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500";

export function ManagerEditForm({
  adminId, email, initial, roles, districtOptions, t, lang,
}: {
  adminId: number;
  email: string;
  initial: {
    name: string;
    phone: string;
    position: string;
    department: string;
    role: string;
    district_ids: number[];
  };
  roles: RoleOption[];
  districtOptions: DistrictOption[];
  t: T;
  lang: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial.name,
    phone: initial.phone,
    position: initial.position,
    department: initial.department,
    role: initial.role,
  });
  const [districtIds, setDistrictIds] = useState<number[]>(initial.district_ids);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  function toggleDistrict(id: number) {
    setDistrictIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`/api/admin/managers/${adminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          position: form.position,
          department: form.department,
          role: form.role,
          district_ids: form.role === "social_worker" ? districtIds : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.errorServer); return; }

      router.push(`/${lang}/managers`);
      router.refresh();
    } catch {
      setError(t.errorServer);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    setDeleteError(""); setDeleting(true);
    try {
      const res = await fetch(`/api/admin/managers/${adminId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error || t.errorServer); return; }
      router.push(`/${lang}/managers`);
      router.refresh();
    } catch {
      setDeleteError(t.errorServer);
    } finally {
      setDeleting(false);
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
              <Label>{t.email}</Label>
              <Input value={email} disabled />
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

            {form.role === "social_worker" && (
              <div>
                <Label>{t.districtLabel}</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-border rounded-lg p-3">
                  {districtOptions.length === 0 && (
                    <p className="text-sm text-muted text-center py-2">{t.districtEmpty}</p>
                  )}
                  {districtOptions.map((d) => {
                    const checked = districtIds.includes(d.id);
                    return (
                      <label key={d.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDistrict(d.id)}
                          className="h-4 w-4 rounded border-gray-300 text-trust-700 focus:ring-trust-500"
                        />
                        <span className="text-sm">{d.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => { setDeleteError(""); setDeleteOpen(true); }}
              >
                {t.deleteBtn}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.push(`/${lang}/managers`)}>
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? t.saving : t.save}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl p-6">
            <h2 className="text-lg font-bold mb-2">{t.deleteConfirmTitle}</h2>
            <p className="text-sm text-muted mb-1 font-semibold">{form.name}</p>
            <p className="text-sm text-gray-600 mb-4">{t.deleteConfirmBody}</p>
            {deleteError && <p className="mb-2 text-sm text-red-600">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                {t.deleteCancelBtn}
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? t.deleting : t.deleteConfirmBtn}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
