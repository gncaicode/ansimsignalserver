"use client";

import { useState, useEffect } from "react";
import { formatElapsed } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n";

export function ElapsedTimer({
  lastCheckIn,
  locale,
}: {
  lastCheckIn: string;
  locale: Locale;
}) {
  const calc = () => (Date.now() - new Date(lastCheckIn).getTime()) / 3_600_000;

  const [elapsed, setElapsed] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setElapsed(calc), 60_000);
    return () => clearInterval(id);
  }, [lastCheckIn]);

  return <>{formatElapsed(elapsed, locale)}</>;
}
