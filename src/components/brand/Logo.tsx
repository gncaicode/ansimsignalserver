import { cn } from "@/lib/utils";

const NAMES = {
  ko: { name: "안심시그널", sub: "ANSIM SIGNAL" },
  ja: { name: "安心シグナル", sub: "ANSHIN SIGNAL" },
} as const;

export function Logo({
  locale = "ko",
  className,
  variant = "horizontal",
  invert = false,
}: {
  locale?: keyof typeof NAMES;
  className?: string;
  variant?: "horizontal" | "icon";
  invert?: boolean;
}) {
  const fg = invert ? "text-white" : "text-trust-700";
  const sub = invert ? "text-trust-100" : "text-muted";
  const labels = NAMES[locale];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-trust-700">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 text-white"
          aria-hidden="true"
        >
          <path
            d="M12 2.5 4 5.2v6.1c0 4.7 3.4 8.7 8 10.2 4.6-1.5 8-5.5 8-10.2V5.2L12 2.5Z"
            fill="currentColor"
            opacity="0.95"
          />
          <path
            d="M9.5 12.5h2l1-2.5 2 5 1-2.5h2"
            stroke="#16A34A"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-status-safe ring-2 ring-white" />
      </span>
      {variant === "horizontal" && (
        <div className="leading-tight">
          <div className={cn("text-[15px] font-extrabold tracking-tight", fg)}>
            {labels.name}
          </div>
          <div className={cn("text-[10px] font-medium tracking-[0.18em]", sub)}>
            {labels.sub.replace(/\s/g, " ")}
          </div>
        </div>
      )}
    </div>
  );
}
