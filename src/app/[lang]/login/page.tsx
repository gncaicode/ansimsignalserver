import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDictionary, hasLocale } from "@/lib/i18n";

export default async function LoginPage(props: PageProps<"/[lang]/login">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.auth.login;

  return (
    <AuthLayout
      locale={lang}
      title={t.title}
      subtitle={t.subtitle}
      panel={dict.auth.brandPanel}
    >
      <form className="space-y-5" action={`/${lang}/dashboard`}>
        <div>
          <Label htmlFor="email">{t.labelEmail}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t.placeholderEmail}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t.labelPassword}</Label>
            <Link
              href="#"
              className="text-xs font-medium text-trust-700 hover:underline"
            >
              {t.forgot}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder={t.placeholderPassword}
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <Label htmlFor="otp">{t.labelOtp}</Label>
          <Input
            id="otp"
            inputMode="numeric"
            maxLength={6}
            placeholder={t.placeholderOtp}
          />
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-subtle">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t.otpHelp}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border-strong text-trust-700 focus:ring-trust-500"
          />
          {t.remember}
        </label>

        <Button type="submit" size="lg" className="w-full">
          <Lock className="h-4 w-4" />
          {t.submit}
        </Button>

        <div className="text-center text-sm text-muted">
          {t.noAccount}{" "}
          <Link
            href={`/${lang}/signup`}
            className="font-semibold text-trust-700 hover:underline"
          >
            {t.noAccountCta}
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted/60 p-3 text-xs text-muted leading-relaxed">
          {t.legalNote}
        </div>
      </form>
    </AuthLayout>
  );
}
