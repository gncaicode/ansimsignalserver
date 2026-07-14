"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  checkinMode: string; checkinModeManual: string; checkinModeAppOpen: string; checkinModePassive: string;
  interval: string; intervalSuffix: string;
  cancel: string; submit: string; submitting: string;
  errorServer: string;
  successTitle: string; inviteCodeLabel: string; goList: string;
}

const selectCls = "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500";

export function UserAddForm({
  districts, admins, defaultCheckinMode, defaultIntervalHours, t, lang,
}: {
  districts: Option[];
  admins: Option[];
  defaultCheckinMode: "manual" | "appOpen" | "passive";
  defaultIntervalHours: number;
  t: T;
  lang: string;
}) {
  const router = useRouter();
  const EMPTY = {
    name: "", age: "", district_id: "", address: "", emergency_phone: "", admin_id: "",
    checkin_mode: defaultCheckinMode, interval_hours: String(defaultIntervalHours),
  };
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          age: Number(form.age),
          district_id: form.district_id || null,
          address: form.address,
          emergency_phone: form.emergency_phone,
          admin_id: form.admin_id || null,
          checkin_mode: form.checkin_mode,
          interval_hours: Number(form.interval_hours),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.errorServer); return; }
      setInviteCode(data.invite_code ?? "");
    } catch {
      setError(t.errorServer);
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!inviteCode) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    } else {
      const el = document.createElement("textarea");
      el.value = inviteCode; el.style.position = "fixed"; el.style.opacity = "0";
      document.body.appendChild(el); el.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
      document.body.removeChild(el);
    }
  }

  // 성공 화면
  if (inviteCode !== null) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-5">
            <CheckCircle2 className="h-12 w-12 text-status-safe-fg mx-auto" />
            <h2 className="text-xl font-bold">{t.successTitle}</h2>
            {inviteCode && (
              <div className="space-y-2">
                <p className="text-sm text-muted">{t.inviteCodeLabel}</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-mono font-bold tracking-widest text-trust-700">
                    {inviteCode}
                  </span>
                  <button onClick={copy} className="text-muted hover:text-trust-700 transition-colors">
                    {copied ? <Check className="h-5 w-5 text-status-safe-fg" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}
            <Button onClick={() => router.push(`/${lang}/users`)} className="w-full mt-4">
              {t.goList}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
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
              <select id="district_id" name="district_id" value={form.district_id} onChange={handle} className={selectCls}>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="checkin_mode">{t.checkinMode}</Label>
                <select id="checkin_mode" name="checkin_mode" value={form.checkin_mode} onChange={handle} className={selectCls}>
                  <option value="manual">{t.checkinModeManual}</option>
                  <option value="appOpen">{t.checkinModeAppOpen}</option>
                  <option value="passive">{t.checkinModePassive}</option>
                </select>
              </div>
              <div>
                <Label htmlFor="interval_hours">{t.interval}</Label>
                <select id="interval_hours" name="interval_hours" value={form.interval_hours} onChange={handle} className={selectCls}>
                  <option value="12">{`12${t.intervalSuffix}`}</option>
                  <option value="24">{`24${t.intervalSuffix}`}</option>
                </select>
              </div>
            </div>

            {/* 담당자 배정 비활성화 — 구역별 복지사 자동 연결로 대체
            <div>
              <Label htmlFor="admin_id">{t.admin}</Label>
              <select id="admin_id" name="admin_id" value={form.admin_id} onChange={handle} className={selectCls}>
                <option value="">{t.adminPlaceholder}</option>
                {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            */}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/${lang}/users`)}>
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
