"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALES = ["ko", "ja"] as const;
type Locale = (typeof LOCALES)[number];

const SHORT_LABEL: Record<Locale, string> = {
  ko: "KO",
  ja: "JA",
};

const FULL_LABEL: Record<Locale, string> = {
  ko: "한국어",
  ja: "日本語",
};

function setLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`;
}

function swapLocaleInPath(pathname: string, target: Locale): string {
  const seg = pathname.split("/").filter(Boolean);
  if (seg.length === 0) return `/${target}`;
  if ((LOCALES as readonly string[]).includes(seg[0])) {
    seg[0] = target;
  } else {
    seg.unshift(target);
  }
  return "/" + seg.join("/");
}

export function LocaleSwitcher({
  current,
  variant = "header",
  className,
}: {
  current: Locale;
  variant?: "header" | "ghost";
  className?: string;
}) {
  const pathname = usePathname() || "/";

  if (variant === "ghost") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 p-0.5 text-xs",
          className,
        )}
      >
        {LOCALES.map((l) => {
          const active = l === current;
          const href = swapLocaleInPath(pathname, l);
          return (
            <Link
              key={l}
              href={href}
              onClick={() => setLocaleCookie(l)}
              aria-label={`Switch to ${FULL_LABEL[l]}`}
              className={cn(
                "px-2.5 py-1 rounded-full font-bold transition-colors",
                active
                  ? "bg-white text-trust-700"
                  : "text-white/85 hover:text-white",
              )}
            >
              {SHORT_LABEL[l]}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-white p-0.5 text-xs",
        className,
      )}
    >
      <span className="px-2 text-subtle">
        <Globe className="h-3.5 w-3.5" />
      </span>
      {LOCALES.map((l) => {
        const active = l === current;
        const href = swapLocaleInPath(pathname, l);
        return (
          <Link
            key={l}
            href={href}
            onClick={() => setLocaleCookie(l)}
            aria-label={`Switch to ${FULL_LABEL[l]}`}
            className={cn(
              "px-2.5 py-1 rounded-full font-bold transition-colors",
              active
                ? "bg-trust-700 text-white"
                : "text-foreground hover:bg-surface-muted",
            )}
          >
            {SHORT_LABEL[l]}
          </Link>
        );
      })}
    </div>
  );
}
