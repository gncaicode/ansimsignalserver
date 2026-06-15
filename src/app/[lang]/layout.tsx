import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import {
  DEFAULT_LOCALE,
  LOCALES,
  getDictionary,
  hasLocale,
} from "@/lib/i18n";

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(
  props: LayoutProps<"/[lang]">,
): Promise<Metadata> {
  const { lang } = await props.params;
  const safeLang = hasLocale(lang) ? lang : DEFAULT_LOCALE;
  const dict = await getDictionary(safeLang);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
  };
}

export default async function RootLayout(props: LayoutProps<"/[lang]">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  return (
    <html lang={lang} className="h-full antialiased">
      <head>
        {/* Pretendard (한국어) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* Noto Sans JP (일본어) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {props.children}
      </body>
    </html>
  );
}
