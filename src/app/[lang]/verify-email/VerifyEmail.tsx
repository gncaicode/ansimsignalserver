"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  lang: string;
  token: string;
  t: {
    verifying: string;
    successTitle: string;
    successDesc: string;
    failTitle: string;
    failDesc: string;
    toLogin: string;
  };
}

export function VerifyEmail({ lang, token, t }: Props) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const sent = useRef(false);

  useEffect(() => {
    // 토큰은 1회용이므로 개발 모드의 이중 실행에서도 한 번만 보낸다.
    if (!token || sent.current) return;
    sent.current = true;
    fetch("/api/admin/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => setStatus(res.ok ? "success" : "error"))
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "loading") {
    return <p className="text-sm text-muted">{t.verifying}</p>;
  }

  const ok = status === "success";
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        {ok
          ? <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
          : <XCircle className="h-6 w-6 shrink-0 text-red-600" />}
        <div>
          <p className="font-semibold">{ok ? t.successTitle : t.failTitle}</p>
          <p className="mt-1 text-sm text-muted leading-relaxed">{ok ? t.successDesc : t.failDesc}</p>
        </div>
      </div>
      <Link
        href={`/${lang}/login`}
        className="flex h-12 w-full items-center justify-center rounded-lg bg-trust-700 px-6 text-base font-semibold text-white hover:bg-trust-800"
      >
        {t.toLogin}
      </Link>
    </div>
  );
}
