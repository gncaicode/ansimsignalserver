import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { VerifyEmail } from "./VerifyEmail";

export default async function VerifyEmailPage(props: PageProps<"/[lang]/verify-email">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.auth.login.verifyPage;

  const searchParams = await props.searchParams;
  const token = typeof searchParams?.token === "string" ? searchParams.token : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">{t.title}</h1>
        <div className="mt-6">
          <VerifyEmail lang={lang} token={token} t={t} />
        </div>
      </div>
    </div>
  );
}
