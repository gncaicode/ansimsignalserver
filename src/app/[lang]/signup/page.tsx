import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupForm } from "./SignupForm";

export default async function SignupPage(props: PageProps<"/[lang]/signup">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <AuthLayout
      locale={lang}
      title={dict.auth.signup.title}
      subtitle={dict.auth.signup.subtitle}
      panel={dict.auth.brandPanel}
    >
      <SignupForm lang={lang} t={dict.auth.signup} />
    </AuthLayout>
  );
}
