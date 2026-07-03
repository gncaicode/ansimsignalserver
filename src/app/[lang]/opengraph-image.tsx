import { ImageResponse } from "next/og";
import { DEFAULT_LOCALE, getDictionary, hasLocale } from "@/lib/i18n";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "안심시그널 · 安心シグナル";

async function loadGoogleFont(family: string, text: string) {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
        family,
      )}:wght@700&text=${encodeURIComponent(text)}`,
    )
  ).text();
  const match = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);
  if (!match) throw new Error(`Font not found for ${family}`);
  const res = await fetch(match[1]);
  return res.arrayBuffer();
}

export default async function Image(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  const safeLang = hasLocale(lang) ? lang : DEFAULT_LOCALE;
  const dict = await getDictionary(safeLang);
  const t = dict.landing.hero;
  const brand = dict.brand;

  const title = brand.name;
  const tagline = dict.meta.description;
  const badge = t.badge;

  const fontFamily = safeLang === "ja" ? "Noto Sans JP" : "Noto Sans KR";
  const fontData = await loadGoogleFont(
    fontFamily,
    `${title}${tagline}${badge}${brand.sub}`,
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #1e3a8a 0%, #1e3577 55%, #172554 100%)",
          fontFamily,
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "rgba(255,255,255,0.14)",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2.5 4 5.2v6.1c0 4.7 3.4 8.7 8 10.2 4.6-1.5 8-5.5 8-10.2V5.2L12 2.5Z"
                fill="#ffffff"
                opacity="0.95"
              />
              <path
                d="M9.5 12.5h2l1-2.5 2 5 1-2.5h2"
                stroke="#16A34A"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 36, fontWeight: 700 }}>{title}</span>
            <span
              style={{
                fontSize: 16,
                letterSpacing: 4,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {brand.sub}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            maxWidth: 980,
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 20px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              fontSize: 20,
            }}
          >
            {badge}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.9)",
            }}
          >
            {tagline}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: fontFamily, data: fontData, style: "normal", weight: 700 }],
    },
  );
}
