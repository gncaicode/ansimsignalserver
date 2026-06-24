"use client";

import { useState } from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface District { dist_id: number; name: string; }
interface AdminOption { id: number; name: string; }

type SettingsT = {
  org: { title: string; name: string; save: string; saving: string; success: string; errorServer: string; };
  district: { title: string; desc: string; placeholder: string; add: string; empty: string; deleteA11y: string; errorServer: string; };
  superadmin: { title: string; desc: string; select: string; save: string; saving: string; success: string; errorSelf: string; errorServer: string; };
};

export function SettingsForm({
  orgName,
  districts: initialDistricts,
  admins,
  isSuperadmin,
  t,
}: {
  orgName: string;
  districts: District[];
  admins: AdminOption[];
  isSuperadmin: boolean;
  t: SettingsT;
}) {
  // 기관 정보
  const [org, setOrg] = useState(orgName);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState("");
  const [orgSuccess, setOrgSuccess] = useState(false);

  // 관할 구역
  const [districts, setDistricts] = useState<District[]>(initialDistricts);
  const [distInput, setDistInput] = useState("");
  const [distError, setDistError] = useState("");
  const [distLoading, setDistLoading] = useState(false);

  // 최고관리자 변경
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [saLoading, setSaLoading] = useState(false);
  const [saError, setSaError] = useState("");
  const [saSuccess, setSaSuccess] = useState(false);

  async function saveOrg() {
    setOrgError(""); setOrgSuccess(false); setOrgLoading(true);
    try {
      const res = await fetch("/api/admin/settings/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: org }),
      });
      const data = await res.json();
      if (!res.ok) { setOrgError(data.error || t.org.errorServer); return; }
      setOrgSuccess(true);
      setTimeout(() => setOrgSuccess(false), 3000);
    } catch { setOrgError(t.org.errorServer); }
    finally { setOrgLoading(false); }
  }

  async function addDistrict() {
    if (!distInput.trim()) return;
    setDistError(""); setDistLoading(true);
    try {
      const res = await fetch("/api/admin/districts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: distInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setDistError(data.error || t.district.errorServer); return; }
      setDistricts((prev) => [...prev, { dist_id: data.dist_id, name: data.name }]);
      setDistInput("");
    } catch { setDistError(t.district.errorServer); }
    finally { setDistLoading(false); }
  }

  async function removeDistrict(distId: number) {
    setDistError("");
    try {
      const res = await fetch(`/api/admin/districts/${distId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setDistError(data.error || t.district.errorServer); return; }
      setDistricts((prev) => prev.filter((d) => d.dist_id !== distId));
    } catch { setDistError(t.district.errorServer); }
  }

  async function changeSuperadmin() {
    setSaError(""); setSaSuccess(false);
    if (!selectedAdmin) { setSaError(t.superadmin.errorServer); return; }
    setSaLoading(true);
    try {
      const res = await fetch("/api/admin/settings/superadmin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: Number(selectedAdmin) }),
      });
      const data = await res.json();
      if (!res.ok) { setSaError(data.error || t.superadmin.errorServer); return; }
      setSaSuccess(true);
      setTimeout(() => { window.location.reload(); }, 2000);
    } catch { setSaError(t.superadmin.errorServer); }
    finally { setSaLoading(false); }
  }

  return (
    <main className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full space-y-6">
      {/* 기관 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.org.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.org.name}</label>
            <Input value={org} onChange={(e) => setOrg(e.target.value)} placeholder={t.org.name} />
          </div>
          {orgError && <p className="text-sm text-red-600">{orgError}</p>}
          {orgSuccess && <p className="text-sm text-status-safe-fg">{t.org.success}</p>}
          <div className="flex justify-end pt-2">
            <Button onClick={saveOrg} disabled={orgLoading}>
              {orgLoading ? t.org.saving : t.org.save}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 관할 구역 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-trust-700" />
            {t.district.title}
          </CardTitle>
          <p className="text-xs text-muted">{t.district.desc}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t.district.placeholder}
              value={distInput}
              onChange={(e) => setDistInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDistrict()}
              className="max-w-sm"
            />
            <Button onClick={addDistrict} disabled={distLoading || !distInput.trim()}>
              <Plus className="h-4 w-4" />
              {t.district.add}
            </Button>
          </div>
          {distError && <p className="text-sm text-red-600">{distError}</p>}
          {districts.length === 0 ? (
            <p className="text-sm text-muted py-2">{t.district.empty}</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {districts.map((d) => (
                <li key={d.dist_id} className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-surface-muted/40">
                  <span className="text-sm font-medium">{d.name}</span>
                  <button
                    onClick={() => removeDistrict(d.dist_id)}
                    className="text-muted hover:text-red-600 transition-colors"
                    aria-label={t.district.deleteA11y}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 최고관리자 변경 — superadmin 전용 */}
      {isSuperadmin && <Card className="border-status-warn-border">
        <CardHeader>
          <CardTitle className="text-status-warn-fg">{t.superadmin.title}</CardTitle>
          <p className="text-xs text-muted">{t.superadmin.desc}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.superadmin.select}</label>
            <select
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
              className="h-10 w-full max-w-sm rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500"
            >
              <option value="">{t.superadmin.select}</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          {saError && <p className="text-sm text-red-600">{saError}</p>}
          {saSuccess && <p className="text-sm text-status-safe-fg">{t.superadmin.success}</p>}
          <div className="flex justify-end pt-2">
            <Button
              onClick={changeSuperadmin}
              disabled={saLoading || !selectedAdmin}
              variant="outline"
              className="border-status-warn-border text-status-warn-fg hover:bg-status-warn-bg"
            >
              {saLoading ? t.superadmin.saving : t.superadmin.save}
            </Button>
          </div>
        </CardContent>
      </Card>}
    </main>
  );
}
