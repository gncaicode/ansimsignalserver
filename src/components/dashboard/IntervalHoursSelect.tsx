"use client";

import { useState } from "react";
import { INTERVAL_HOURS_MIN, INTERVAL_HOURS_MAX } from "@/lib/validation";

const PRESETS = ["12", "24", "48"];
const MIN = INTERVAL_HOURS_MIN;
const MAX = INTERVAL_HOURS_MAX;

export function IntervalHoursSelect({
  id,
  name,
  value,
  onChange,
  intervalSuffix,
  otherLabel,
  className,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  intervalSuffix: string;
  otherLabel: string;
  className?: string;
}) {
  // "기타" 모드 여부를 매 렌더링마다 value로부터 다시 계산하지 않고 별도로 기억한다.
  // (그렇지 않으면 기타 입력 중 값이 우연히 12/24/48과 같아질 때 입력창이 사라짐)
  const [mode, setMode] = useState<"preset" | "other">(
    PRESETS.includes(value) ? "preset" : "other"
  );

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === "other") {
      setMode("other");
      onChange("");
    } else {
      setMode("preset");
      onChange(e.target.value);
    }
  }

  const selectValue = mode === "preset" ? value : "other";

  return (
    <div className="space-y-2">
      <select id={id} name={mode === "preset" ? name : undefined} value={selectValue} onChange={handleSelect} className={className}>
        {PRESETS.map((h) => (
          <option key={h} value={h}>{`${h}${intervalSuffix}`}</option>
        ))}
        <option value="other">{otherLabel}</option>
      </select>
      {mode === "other" && (
        <input
          type="number"
          id={id ? `${id}-other` : undefined}
          name={name}
          aria-label={otherLabel}
          min={MIN}
          max={MAX}
          step={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${MIN}~${MAX}`}
          className={className}
        />
      )}
    </div>
  );
}
