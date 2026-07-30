import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { LegalDocPage } from "@/components/legal/LegalDocPage";

export default async function TermsPage(props: PageProps<"/[lang]/terms">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return <LegalDocPage doc={dict.auth.termsPage} />;
}
