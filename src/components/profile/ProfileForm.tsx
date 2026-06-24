"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface T {
  infoTitle: string;
  name: string; namePlaceholder: string;
  phone: string; phonePlaceholder: string;
  position: string; positionPlaceholder: string;
  department: string; departmentPlaceholder: string;
  save: string; saving: string; infoSuccess: string;
  pwTitle: string;
  current: string; currentPlaceholder: string;
  newPw: string; newPlaceholder: string;
  confirm: string; confirmPlaceholder: string;
  pwSave: string; pwSaving: string; pwSuccess: string;
  errorMismatch: string; errorLength: string; errorServer: string;
}

interface Profile { name: string; phone: string; position: string; department: string; }

export function ProfileForm({ profile: initial, t }: { profile: Profile; t: T }) {
  // 기본 정보
  const [form, setForm] = useState(initial);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [infoSuccess, setInfoSuccess] = useState(false);

  // 비밀번호
  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  async function saveInfo() {
    setInfoError(""); setInfoSuccess(false); setInfoLoading(true);
    try {
      const res = await fetch("/api/admin/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setInfoError(data.error || t.errorServer); return; }
      setInfoSuccess(true);
      setTimeout(() => setInfoSuccess(false), 3000);
    } catch { setInfoError(t.errorServer); }
    finally { setInfoLoading(false); }
  }

  async function savePassword() {
    setPwError(""); setPwSuccess(false);
    if (pw.newPw.length < 8) { setPwError(t.errorLength); return; }
    if (pw.newPw !== pw.confirm) { setPwError(t.errorMismatch); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/admin/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.newPw, confirmPassword: pw.confirm }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || t.errorServer); return; }
      setPwSuccess(true);
      setPw({ current: "", newPw: "", confirm: "" });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch { setPwError(t.errorServer); }
    finally { setPwLoading(false); }
  }

  return (
    <main className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.infoTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.name}</label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder={t.namePlaceholder} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.phone}</label>
            <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder={t.phonePlaceholder} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t.position}</label>
              <Input value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} placeholder={t.positionPlaceholder} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.department}</label>
              <Input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} placeholder={t.departmentPlaceholder} />
            </div>
          </div>
          {infoError && <p className="text-sm text-red-600">{infoError}</p>}
          {infoSuccess && <p className="text-sm text-status-safe-fg">{t.infoSuccess}</p>}
          <div className="flex justify-end pt-2">
            <Button onClick={saveInfo} disabled={infoLoading}>
              {infoLoading ? t.saving : t.save}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.pwTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.current}</label>
            <Input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} placeholder={t.currentPlaceholder} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.newPw}</label>
            <Input type="password" value={pw.newPw} onChange={(e) => setPw((p) => ({ ...p, newPw: e.target.value }))} placeholder={t.newPlaceholder} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.confirm}</label>
            <Input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} placeholder={t.confirmPlaceholder} />
          </div>
          {pwError && <p className="text-sm text-red-600">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-status-safe-fg">{t.pwSuccess}</p>}
          <div className="flex justify-end pt-2">
            <Button onClick={savePassword} disabled={pwLoading}>
              {pwLoading ? t.pwSaving : t.pwSave}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
