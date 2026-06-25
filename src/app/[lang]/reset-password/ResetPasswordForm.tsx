"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  lang: string;
  token: string;
  t: {
    labelPassword: string;
    placeholderPassword: string;
    labelConfirm: string;
    placeholderConfirm: string;
    submit: string;
    successTitle: string;
    successDesc: string;
    backToLogin: string;
    invalidToken: string;
    mismatch: string;
    weak: string;
  };
}

export function ResetPasswordForm({ lang, token, t }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) { setError(t.weak); return; }
    if (password !== confirm) { setError(t.mismatch); return; }

    setStatus("loading");
    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json();
        setError(data.error ?? t.invalidToken);
        setStatus("error");
      }
    } catch {
      setError("서버와 통신할 수 없습니다.");
      setStatus("error");
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-red-600">{t.invalidToken}</p>
        <Link href={`/${lang}/forgot-password`} className="text-sm text-trust-700 hover:underline">
          {t.backToLogin}
        </Link>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">✓</div>
        <h2 className="font-bold text-lg">{t.successTitle}</h2>
        <p className="text-sm text-muted">{t.successDesc}</p>
        <Link href={`/${lang}/login`} className="inline-block mt-4 text-sm text-trust-700 font-medium hover:underline">
          {t.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="password">{t.labelPassword}</Label>
        <Input
          id="password"
          type="password"
          placeholder={t.placeholderPassword}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="confirm">{t.labelConfirm}</Label>
        <Input
          id="confirm"
          type="password"
          placeholder={t.placeholderConfirm}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "처리 중..." : t.submit}
      </Button>
    </form>
  );
}
