"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminData {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
}

interface OrgData {
  name: string;
}

type SettingsT = {
  profile: {
    title: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    save: string;
    saving: string;
    success: string;
    errorServer: string;
  };
  password: {
    title: string;
    current: string;
    new: string;
    confirm: string;
    save: string;
    saving: string;
    success: string;
    errorMismatch: string;
    errorLength: string;
    errorWrong: string;
    errorServer: string;
  };
  org: {
    title: string;
    name: string;
    save: string;
    saving: string;
    success: string;
    errorServer: string;
  };
};

export function SettingsForm({
  admin,
  org,
  t,
  canEditOrg,
}: {
  admin: AdminData;
  org: OrgData | null;
  t: SettingsT;
  canEditOrg: boolean;
}) {
  const [profileForm, setProfileForm] = useState(admin);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [orgForm, setOrgForm] = useState(org?.name ?? "");
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState("");
  const [orgSuccess, setOrgSuccess] = useState(false);

  // Profile 저장
  async function saveProfile() {
    setProfileError("");
    setProfileSuccess(false);
    setProfileLoading(true);

    try {
      const res = await fetch("/api/admin/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();

      if (!res.ok) {
        setProfileError(data.error || t.profile.errorServer);
        return;
      }

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError(t.profile.errorServer);
    } finally {
      setProfileLoading(false);
    }
  }

  // Password 변경
  async function savePassword() {
    setPasswordError("");
    setPasswordSuccess(false);

    if (passwordForm.new.length < 8) {
      setPasswordError(t.password.errorLength);
      return;
    }

    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError(t.password.errorMismatch);
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/admin/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
          confirmPassword: passwordForm.confirm,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setPasswordError(t.password.errorWrong);
        } else {
          setPasswordError(data.error || t.password.errorServer);
        }
        return;
      }

      setPasswordSuccess(true);
      setPasswordForm({ current: "", new: "", confirm: "" });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch {
      setPasswordError(t.password.errorServer);
    } finally {
      setPasswordLoading(false);
    }
  }

  // Org 저장
  async function saveOrg() {
    setOrgError("");
    setOrgSuccess(false);
    setOrgLoading(true);

    try {
      const res = await fetch("/api/admin/settings/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgForm }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOrgError(data.error || t.org.errorServer);
        return;
      }

      setOrgSuccess(true);
      setTimeout(() => setOrgSuccess(false), 3000);
    } catch {
      setOrgError(t.org.errorServer);
    } finally {
      setOrgLoading(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full space-y-6">
      {/* 개인정보 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.profile.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.profile.name}</label>
            <Input
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              placeholder={t.profile.name}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t.profile.email}</label>
            <Input
              value={profileForm.email}
              disabled
              className="bg-surface-muted text-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted mt-1">이메일은 변경할 수 없습니다.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t.profile.phone}</label>
            <Input
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder={t.profile.phone}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t.profile.position}</label>
            <Input
              value={profileForm.position}
              onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
              placeholder={t.profile.position}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t.profile.department}</label>
            <Input
              value={profileForm.department}
              onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
              placeholder={t.profile.department}
            />
          </div>

          {profileError && <p className="text-sm text-red-600">{profileError}</p>}
          {profileSuccess && <p className="text-sm text-status-safe-fg">{t.profile.success}</p>}

          <div className="flex justify-end pt-2">
            <Button onClick={saveProfile} disabled={profileLoading}>
              {profileLoading ? t.profile.saving : t.profile.save}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 */}
      <Card>
        <CardHeader>
          <CardTitle>{t.password.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.password.current}</label>
            <Input
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              placeholder={t.password.current}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t.password.new}</label>
            <Input
              type="password"
              value={passwordForm.new}
              onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
              placeholder={t.password.new}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t.password.confirm}</label>
            <Input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              placeholder={t.password.confirm}
            />
          </div>

          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-status-safe-fg">{t.password.success}</p>}

          <div className="flex justify-end pt-2">
            <Button onClick={savePassword} disabled={passwordLoading}>
              {passwordLoading ? t.password.saving : t.password.save}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 기관 정보 */}
      {canEditOrg && (
        <Card>
          <CardHeader>
            <CardTitle>{t.org.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.org.name}</label>
              <Input
                value={orgForm}
                onChange={(e) => setOrgForm(e.target.value)}
                placeholder={t.org.name}
              />
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
      )}
    </main>
  );
}
