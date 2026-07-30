"use client";

export function CloseButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.close()}
      className="mt-8 w-full rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
    >
      {label}
    </button>
  );
}
