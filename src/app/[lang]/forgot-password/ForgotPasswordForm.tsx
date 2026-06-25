"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  lang: string;
  t: {
    labelEmail: string;
    placeholderEmail: string;
    submit: string;
    successTitle: string;
    successDesc: string;
    backToLogin: string;
    notFound: string;
  };
}

export function ForgotPasswordForm({ lang, t }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json();
        setError(data.error ?? "오류가 발생했습니다.");
        setStatus("error");
      }
    } catch {
      setError("서버와 통신할 수 없습니다.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">📧</div>
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
        <Label htmlFor="email">{t.labelEmail}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t.placeholderEmail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "처리 중..." : t.submit}
      </Button>
      <div className="text-center">
        <Link href={`/${lang}/login`} className="text-sm text-trust-700 hover:underline">
          {t.backToLogin}
        </Link>
      </div>
    </form>
  );
}
