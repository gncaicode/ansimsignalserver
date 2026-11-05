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
  testLogin: string; testLoginLoading: string;
  noAccount: string; noAccountCta: string;
  legalNote: string;
  registeredNotice: string;
  resendVerification: string;
  resendDone: string;
};

export function LoginForm({
  lang, t, registered = false, initialEmail = "",
}: { lang: string; t: LoginDict; registered?: boolean; initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setUnverified(false);
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
        setUnverified(data.code === "email_unverified");
        return;
      }
      router.push(`/${lang}/dashboard`);
    } catch {
      setError("서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setResendState("sending");
    try {
      await fetch("/api/admin/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
      });
      setResendState("done");
    } catch {
      setResendState("idle");
      setError("서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  async function testLogin() {
    setError("");
    setTestLoading(true);
    try {
      const res = await fetch("/api/admin/auth/test-login", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "오류가 발생했습니다.");
        return;
      }
      router.push(`/${lang}/dashboard`);
    } catch {
      setError("서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      {registered && (
        <div className="rounded-lg border border-trust-100 bg-trust-50 p-3 text-sm text-trust-800 leading-relaxed">
          {t.registeredNotice}
        </div>
      )}
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
          <Link href={`/${lang}/forgot-password`} className="text-xs font-medium text-trust-700 hover:underline">
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

      {unverified && (
        resendState === "done" ? (
          <p className="text-sm text-trust-700 text-center">{t.resendDone}</p>
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={resendState === "sending"}
            onClick={resendVerification}
          >
            {t.resendVerification}
          </Button>
        )
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading || testLoading}>
        <Lock className="h-4 w-4" />
        {loading ? "로그인 중..." : t.submit}
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={loading || testLoading}
        onClick={testLogin}
      >
        {testLoading ? t.testLoginLoading : t.testLogin}
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
