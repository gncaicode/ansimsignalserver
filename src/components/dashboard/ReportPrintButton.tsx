"use client";

export function ReportPrintButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-foreground/80 active:scale-95 transition-all"
    >
      {label}
    </button>
  );
}
