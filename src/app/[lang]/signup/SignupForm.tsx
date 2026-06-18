"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignupDict = {
  labelOrg: string; placeholderOrg: string;
  labelDept: string; placeholderDept: string;
  labelPosition: string; placeholderPosition: string;
  labelName: string; placeholderName: string;
  labelEmail: string; placeholderEmail: string; emailHelp: string;
  labelPhone: string; placeholderPhone: string;
  labelPassword: string; placeholderPassword: string;
  labelPassword2: string;
  terms: { required1: string; viewTerms: string; required2: string; optional: string };
  submit: string;
  hasAccount: string; hasAccountCta: string;
};

export function SignupForm({ lang, t }: { lang: string; t: SignupDict }) {
  const router = useRouter();

  const [form, setForm] = useState({
    org: "", department: "", position: "", name: "",
    email: "", phone: "", password: "", password2: "",
    agree_terms: false, agree_privacy: false, agree_marketing: false,
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const { id, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [id]: type === "checkbox" ? checked : value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.password2) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org:             form.org,
          department:      form.department,
          position:        form.position,
          name:            form.name,
          email:           form.email,
          phone:           form.phone,
          password:        form.password,
          agree_terms:     form.agree_terms,
          agree_privacy:   form.agree_privacy,
          agree_marketing: form.agree_marketing,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "오류가 발생했습니다.");
        return;
      }

      router.push(`/${lang}/login?registered=1`);
    } catch {
      setError("서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="org">{t.labelOrg}</Label>
          <Input id="org" placeholder={t.placeholderOrg}
            value={form.org} onChange={handle} required />
        </div>
        <div>
          <Label htmlFor="department">{t.labelDept}</Label>
          <Input id="department" placeholder={t.placeholderDept}
            value={form.department} onChange={handle} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="position">{t.labelPosition}</Label>
          <Input id="position" placeholder={t.placeholderPosition}
            value={form.position} onChange={handle} required />
        </div>
        <div>
          <Label htmlFor="name">{t.labelName}</Label>
          <Input id="name" placeholder={t.placeholderName} autoComplete="name"
            value={form.name} onChange={handle} required />
        </div>
      </div>

      <div>
        <Label htmlFor="email">{t.labelEmail}</Label>
        <Input id="email" type="email" placeholder={t.placeholderEmail}
          autoComplete="email" value={form.email} onChange={handle} required />
        <p className="mt-1.5 text-xs text-subtle">{t.emailHelp}</p>
      </div>

      <div>
        <Label htmlFor="phone">{t.labelPhone}</Label>
        <Input id="phone" inputMode="tel" placeholder={t.placeholderPhone}
          value={form.phone} onChange={handle} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="password">{t.labelPassword}</Label>
          <Input id="password" type="password" placeholder="8자 이상"
            value={form.password} onChange={handle} required />
        </div>
        <div>
          <Label htmlFor="password2">{t.labelPassword2}</Label>
          <Input id="password2" type="password"
            value={form.password2} onChange={handle} required />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface-muted/60 p-4 space-y-2.5 text-sm">
        <label className="flex items-start gap-2.5">
          <input id="agree_terms" type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border-strong text-trust-700 focus:ring-trust-500"
            checked={form.agree_terms} onChange={handle} required />
          <span>
            {t.terms.required1}
            <Link href="#" className="ml-1 text-trust-700 underline-offset-2 hover:underline">
              {t.terms.viewTerms}
            </Link>
          </span>
        </label>
        <label className="flex items-start gap-2.5">
          <input id="agree_privacy" type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border-strong text-trust-700 focus:ring-trust-500"
            checked={form.agree_privacy} onChange={handle} required />
          <span>{t.terms.required2}</span>
        </label>
        <label className="flex items-start gap-2.5">
          <input id="agree_marketing" type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border-strong text-trust-700 focus:ring-trust-500"
            checked={form.agree_marketing} onChange={handle} />
          <span>{t.terms.optional}</span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        <ShieldCheck className="h-4 w-4" />
        {loading ? "처리 중..." : t.submit}
      </Button>

      <div className="text-center text-sm text-muted">
        {t.hasAccount}{" "}
        <Link href={`/${lang}/login`} className="font-semibold text-trust-700 hover:underline">
          {t.hasAccountCta}
        </Link>
      </div>
    </form>
  );
}
