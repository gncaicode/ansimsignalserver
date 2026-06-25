import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage(props: PageProps<"/[lang]/reset-password">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.auth.login.resetPage;

  const searchParams = await (props as any).searchParams;
  const token = (searchParams?.token as string) ?? "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">{t.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.desc}</p>
        <div className="mt-6">
          <ResetPasswordForm lang={lang} token={token} t={t} />
        </div>
      </div>
    </div>
  );
}
