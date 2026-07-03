import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n";

const BASE_URL = "http://assignal.net";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    LOCALES.map((lang) => [lang, `${BASE_URL}/${lang}`]),
  );

  return [
    ...LOCALES.map((lang) => ({
      url: `${BASE_URL}/${lang}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 1,
      alternates: { languages },
    })),
    {
      url: `${BASE_URL}/delete-account`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];
}
