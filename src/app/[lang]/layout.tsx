import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import {
  DEFAULT_LOCALE,
  LOCALES,
  getDictionary,
  hasLocale,
} from "@/lib/i18n";

const LANGUAGE_ALTERNATES = Object.fromEntries(
  LOCALES.map((l) => [l, `/${l}`]),
);

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
    metadataBase: new URL("http://assignal.net"),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `/${safeLang}`,
      languages: LANGUAGE_ALTERNATES,
    },
    verification: {
      google: "46IUtVjOpzzxWbECnUUhlNolJtIKQU_474htyEt-gQ0",
      other: {
        "naver-site-verification": "1c95196fbdaa7e267d1f5f1555df1303f7ad5b30",
      },
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      url: `/${safeLang}`,
      siteName: dict.brand.name,
      locale: safeLang === "ja" ? "ja_JP" : "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
    },
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
