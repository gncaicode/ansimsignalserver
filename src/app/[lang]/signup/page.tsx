import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDictionary, hasLocale } from "@/lib/i18n";

export default async function SignupPage(props: PageProps<"/[lang]/signup">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.auth.signup;

  return (
    <AuthLayout
      locale={lang}
      title={t.title}
      subtitle={t.subtitle}
      panel={dict.auth.brandPanel}
    >
      <form className="space-y-5" action={`/${lang}/login`}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="org">{t.labelOrg}</Label>
            <Input id="org" placeholder={t.placeholderOrg} required />
          </div>
          <div>
            <Label htmlFor="dept">{t.labelDept}</Label>
            <Input id="dept" placeholder={t.placeholderDept} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="position">{t.labelPosition}</Label>
            <Input id="position" placeholder={t.placeholderPosition} required />
          </div>
          <div>
            <Label htmlFor="name">{t.labelName}</Label>
            <Input
              id="name"
              placeholder={t.placeholderName}
              autoComplete="name"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">{t.labelEmail}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t.placeholderEmail}
            autoComplete="email"
            required
          />
          <p className="mt-1.5 text-xs text-subtle">{t.emailHelp}</p>
        </div>

        <div>
          <Label htmlFor="phone">{t.labelPhone}</Label>
          <Input
            id="phone"
            inputMode="tel"
            placeholder={t.placeholderPhone}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="password">{t.labelPassword}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t.placeholderPassword}
              required
            />
          </div>
          <div>
            <Label htmlFor="password2">{t.labelPassword2}</Label>
            <Input id="password2" type="password" required />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted/60 p-4 space-y-2.5 text-sm">
          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-border-strong text-trust-700 focus:ring-trust-500"
              required
            />
            <span>
              {t.terms.required1}
              <Link
                href="#"
                className="ml-1 text-trust-700 underline-offset-2 hover:underline"
              >
                {t.terms.viewTerms}
              </Link>
            </span>
          </label>
          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-border-strong text-trust-700 focus:ring-trust-500"
              required
            />
            <span>{t.terms.required2}</span>
          </label>
          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-border-strong text-trust-700 focus:ring-trust-500"
            />
            <span>{t.terms.optional}</span>
          </label>
        </div>

        <Button type="submit" size="lg" className="w-full">
          <ShieldCheck className="h-4 w-4" />
          {t.submit}
        </Button>

        <div className="text-center text-sm text-muted">
          {t.hasAccount}{" "}
          <Link
            href={`/${lang}/login`}
            className="font-semibold text-trust-700 hover:underline"
          >
            {t.hasAccountCta}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
