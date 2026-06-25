import Link from "next/link";
import { ShieldCheck, Lock, Server } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";

type Locale = "ko" | "ja";

type Panel = {
  title: { line1: string; line2: string };
  desc: string;
  bullets: readonly string[];
  legal: string;
};

export function AuthLayout({
  locale,
  title,
  subtitle,
  panel,
  children,
}: {
  locale: Locale;
  title: string;
  subtitle?: string;
  panel: Panel;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
      {/* 좌측 브랜드 패널 */}
      <div className="hidden lg:flex relative flex-col justify-between bg-gradient-to-br from-trust-700 via-trust-800 to-trust-900 p-12 text-white">
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative flex items-center justify-between">
          <Link href={`/${locale}`}>
            <Logo locale={locale} invert />
          </Link>
          <LocaleSwitcher current={locale} variant="ghost" />
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold leading-snug tracking-tight">
            {panel.title.line1}
            <br />
            {panel.title.line2}
          </h2>
          {panel.desc && <p className="mt-5 text-trust-100/90 leading-relaxed">{panel.desc}</p>}
          <ul className="mt-8 space-y-3 text-sm text-trust-100/90">
            {panel.bullets.map((b, i) => {
              const Icon = [ShieldCheck, Lock, Server][i] ?? ShieldCheck;
              return (
                <li key={b} className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
                    <Icon className="h-4 w-4" />
                  </span>
                  {b}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="relative text-xs text-trust-100/60">
          © {new Date().getFullYear()} {panel.legal}
        </div>
      </div>

      {/* 우측 폼 */}
      <div className="flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex items-center justify-between">
            <Link href={`/${locale}`}>
              <Logo locale={locale} />
            </Link>
            <LocaleSwitcher current={locale} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
