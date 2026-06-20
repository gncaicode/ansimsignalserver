"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginDict = {
  labelEmail: string; placeholderEmail: string;
  labelPassword: string; placeholderPassword: string;
  forgot: string;
  remember: string;
  submit: string;
  noAccount: string; noAccountCta: string;
  legalNote: string;
};

export function LoginForm({ lang, t }: { lang: string; t: LoginDict }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "오류가 발생했습니다.");
        return;
      }
      router.push(`/${lang}/dashboard`);
    } catch {
      setError("서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div>
        <Label htmlFor="email">{t.labelEmail}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t.placeholderEmail}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t.labelPassword}</Label>
          <Link href="#" className="text-xs font-medium text-trust-700 hover:underline">
            {t.forgot}
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder={t.placeholderPassword}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        <Lock className="h-4 w-4" />
        {loading ? "로그인 중..." : t.submit}
      </Button>

      <div className="text-center text-sm text-muted">
        {t.noAccount}{" "}
        <Link href={`/${lang}/signup`} className="font-semibold text-trust-700 hover:underline">
          {t.noAccountCta}
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-surface-muted/60 p-3 text-xs text-muted leading-relaxed">
        {t.legalNote}
      </div>
    </form>
  );
}
