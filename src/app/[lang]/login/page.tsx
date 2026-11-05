import { notFound } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { LoginForm } from "./LoginForm";

export default async function LoginPage(props: PageProps<"/[lang]/login">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.auth.login;
  const searchParams = await props.searchParams;
  const registered = searchParams?.registered === "1";
  const initialEmail = typeof searchParams?.email === "string" ? searchParams.email : "";

  return (
    <AuthLayout
      locale={lang}
      title={t.title}
      subtitle={t.subtitle}
      panel={dict.auth.brandPanel}
    >
      <LoginForm lang={lang} t={t} registered={registered} initialEmail={initialEmail} />
    </AuthLayout>
  );
}
