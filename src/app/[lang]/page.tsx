import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  HeartPulse,
  BellRing,
  Wallet,
  PhoneCall,
  Users,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/brand/StatusBadge";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { InquiryForm } from "@/components/landing/InquiryForm";
import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";

const FEATURE_ICONS = [HeartPulse, BellRing, PhoneCall, Users, ShieldCheck, Wallet];

export default async function LandingPage(props: PageProps<"/[lang]">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.landing;

  return (
    <div className="flex flex-col">
      {/* ============= GNB ============= */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo locale={lang} />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
            <a href="#features" className="hover:text-trust-700">
              {dict.nav.features}
            </a>
            <a href="#roi" className="hover:text-trust-700">
              {dict.nav.roi}
            </a>
            <a href="#process" className="hover:text-trust-700">
              {dict.nav.process}
            </a>
            <a href="#faq" className="hover:text-trust-700">
              {dict.nav.faq}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <LocaleSwitcher current={lang} className="mr-1" />
            <Link href={`/${lang}/login`}>
              <Button variant="ghost" size="sm">
                {dict.nav.login}
              </Button>
            </Link>
            <Link href="#contact">
              <Button size="sm">{dict.nav.contact}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ============= HERO ============= */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-trust-700 via-trust-800 to-trust-900 text-white">
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge
              tone="trust"
              className="bg-trust-50/15 text-trust-100 border border-white/10"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {t.hero.badge}
            </Badge>
            <h1 className="mt-5 text-4xl md:text-5xl font-extrabold leading-[1.18] tracking-tight">
              {t.hero.title.line1}
              <br />
              {t.hero.title.line2Pre}
              <span className="text-safe-500">{t.hero.title.line2Highlight}</span>
              {t.hero.title.line2Post}
              <br />
              {t.hero.title.line3Pre}
              <span className="underline decoration-safe-500 decoration-4 underline-offset-4">
                {t.hero.title.line3Highlight}
              </span>
              {t.hero.title.line3Post}
            </h1>
            <p className="mt-6 text-base md:text-lg text-trust-100/90 leading-relaxed">
              {t.hero.desc}
              <strong className="text-white">{t.hero.descStrong}</strong>
              {t.hero.descTail}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#contact">
                <Button
                  size="lg"
                  variant="success"
                  className="shadow-lg shadow-safe-500/20"
                >
                  {t.hero.ctaPrimary}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {/* <Link href={`/${lang}/dashboard`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  {t.hero.ctaSecondary}
                </Button>
              </Link> */}
            </div>
            {/* <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-trust-100/80">
              {t.hero.bullets.map((b) => (
                <span key={b} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-safe-500" />
                  {b}
                </span>
              ))}
            </div> */}
          </div>

          <DashboardMockup t={t.hero.mockup} locale={lang} />
        </div>
      </section>

      {/* ============= 사회 통계 ============= */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-3 gap-6 text-center">
          {t.social.map((s, i) => (
            <Stat
              key={s.label}
              number={s.number}
              label={s.label}
              sub={s.sub}
              highlight={i === 1}
            />
          ))}
        </div>
      </section>

      {/* ============= 기능 ============= */}
      <section id="features" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <Badge tone="trust">{t.features.badge}</Badge>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
              {t.features.title.line1}
              <br />
              {t.features.title.line2}
            </h2>
            <p className="mt-4 text-muted">{t.features.desc}</p>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {t.features.items.map((f, i) => {
              const Icon = FEATURE_ICONS[i] ?? HeartPulse;
              return (
                <FeatureCard
                  key={f.title}
                  icon={<Icon className="h-5 w-5" />}
                  title={f.title}
                  desc={f.desc}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ============= ROI ============= */}
      <section id="roi" className="border-b border-border bg-trust-50/40">
        <div className="mx-auto max-w-7xl px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge tone="safe">{t.roi.badge}</Badge>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
              {t.roi.title.line1}
              <br />
              {t.roi.title.line2Pre}
              <span className="text-trust-700">{t.roi.title.line2Highlight}</span>
              {t.roi.title.line2Post}
            </h2>
            <p className="mt-5 text-muted leading-relaxed">
              {t.roi.desc}
              <strong>{t.roi.descStrong}</strong>
              {t.roi.descTail}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <CompareCard
                title={t.roi.compare.existing.title}
                price={t.roi.compare.existing.price}
                detail={t.roi.compare.existing.detail}
                negative
              />
              <CompareCard
                title={t.roi.compare.ours.title}
                price={t.roi.compare.ours.price}
                detail={t.roi.compare.ours.detail}
              />
            </div>
            <p className="mt-4 text-xs text-subtle">{t.roi.footnote}</p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-8 shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-safe-100 p-2.5">
                <TrendingDown className="h-6 w-6 text-safe-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-safe-700">
                  {t.roi.effectCard.eyebrow}
                </p>
                <p className="text-2xl font-extrabold text-foreground mt-1">
                  {t.roi.effectCard.headline}
                </p>
              </div>
            </div>
            <hr className="my-6 border-border" />
            <ul className="space-y-4 text-sm">
              {t.roi.effectCard.rows.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-muted">{row.label}</span>
                  <span className="text-right">
                    <span className="font-bold text-foreground">{row.value}</span>
                    <span className="block text-xs text-subtle">{row.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============= 도입 절차 ============= */}
      <section id="process" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <Badge tone="trust">{t.process.badge}</Badge>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
            {t.process.title}
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {t.process.steps.map((s) => (
              <div
                key={s.n}
                className="rounded-xl border border-border bg-white p-6"
              >
                <div className="text-xs font-bold tracking-wider text-trust-500">
                  {t.process.stepLabel} {s.n}
                </div>
                <div className="mt-3 text-lg font-bold">{s.t}</div>
                <div className="mt-2 text-sm text-muted">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============= CTA ============= */}
      <section id="contact" className="bg-trust-900 text-white scroll-mt-16">
        <div className="mx-auto max-w-7xl px-6 py-20 grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {t.cta.title.line1}
              <br />
              {t.cta.title.line2}
            </h2>
            <p className="mt-5 text-trust-100/90">{t.cta.desc}</p>
            <ul className="mt-6 space-y-2 text-sm text-trust-100/90">
              {t.cta.contactCard.items.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <InquiryForm labels={t.cta.form} />
        </div>
      </section>

      {/* ============= 푸터 ============= */}
      <footer className="border-t border-trust-800 bg-trust-900 text-trust-100/60 text-xs">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <Logo locale={lang} invert />
          <p>
            © {new Date().getFullYear()} {t.footer.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ---------- 보조 컴포넌트 ---------- */

function Stat({
  number,
  label,
  sub,
  highlight,
}: {
  number: string;
  label: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-4xl md:text-5xl font-extrabold tracking-tight ${
          highlight ? "text-status-danger" : "text-trust-700"
        }`}
      >
        {number}
      </p>
      <p className="mt-2 text-base font-semibold text-foreground">{label}</p>
      <p className="text-xs text-subtle mt-0.5">{sub}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-6 hover:border-trust-200 hover:shadow-[0_2px_12px_rgba(37,99,235,0.08)] transition-all">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-trust-50 text-trust-700">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted leading-relaxed">{desc}</p>
    </div>
  );
}

function CompareCard({
  title,
  price,
  detail,
  negative,
}: {
  title: string;
  price: string;
  detail: string;
  negative?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        negative
          ? "border-status-danger/30 bg-status-danger-bg/40"
          : "border-status-safe/30 bg-status-safe-bg/40"
      }`}
    >
      <p className="text-xs font-semibold text-muted">{title}</p>
      <p
        className={`mt-1.5 text-2xl font-extrabold ${
          negative ? "text-status-danger" : "text-status-safe-fg"
        }`}
      >
        {price}
      </p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

/* ---------- 대시보드 미리보기 ---------- */
function DashboardMockup({
  t,
  locale,
}: {
  t: Awaited<ReturnType<typeof getDictionary>>["landing"]["hero"]["mockup"];
  locale: Locale;
}) {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/0 blur-2xl" />
      <div className="relative rounded-2xl bg-white text-foreground shadow-2xl shadow-black/30 ring-1 ring-white/10 overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 bg-surface-muted">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-[11px] text-subtle">
            {locale === "ja"
              ? "anshin-signal.jp/dashboard"
              : "ansimsignal.go.kr/dashboard"}
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-subtle">{t.org}</p>
              <p className="text-base font-bold">{t.title}</p>
            </div>
            <span className="text-[11px] text-subtle">{t.updatedAt}</span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            <MiniStat label={t.statTotal} value="124" tone="neutral" />
            <MiniStat label={t.statDanger} value="2" tone="danger" />
            <MiniStat label={t.statWarn} value="3" tone="warn" />
            <MiniStat label={t.statSafe} value="119" tone="safe" />
          </div>
          <div className="mt-4 rounded-lg border border-status-danger/30 bg-status-danger-bg/40 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge status="danger" locale={locale} />
                <span className="font-bold text-sm">{t.criticalName}</span>
                <span className="text-xs text-muted">{t.criticalDistrict}</span>
              </div>
              <span className="text-xs font-bold text-status-danger">
                {t.criticalElapsed}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-muted">{t.criticalContactLabel}</span>
              <span className="text-trust-700 font-semibold">{t.criticalCta}</span>
            </div>
          </div>
          <div className="mt-2 rounded-lg border border-status-warn/30 bg-status-warn-bg/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge status="warn" locale={locale} />
                <span className="font-bold text-sm">{t.warnName}</span>
                <span className="text-xs text-muted">{t.warnDistrict}</span>
              </div>
              <span className="text-xs font-bold text-status-warn-fg">
                {t.warnElapsed}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "safe" | "warn" | "danger";
}) {
  const map = {
    neutral: "bg-surface-muted text-foreground",
    safe: "bg-status-safe-bg text-status-safe-fg",
    warn: "bg-status-warn-bg text-status-warn-fg",
    danger: "bg-status-danger-bg text-status-danger-fg",
  } as const;
  return (
    <div className={`rounded-lg p-2.5 ${map[tone]}`}>
      <p className="text-[11px]">{label}</p>
      <p className="text-xl font-extrabold leading-tight">{value}</p>
    </div>
  );
}
