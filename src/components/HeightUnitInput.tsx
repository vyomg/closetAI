"use client";

import { cn } from "@/lib/cn";

export type HeightUnit = "cm" | "in" | "ftin";

const UNITS: { key: HeightUnit; label: string }[] = [
  { key: "cm", label: "cm" },
  { key: "ftin", label: "ft / in" },
  { key: "in", label: "in" },
];

const CM_MIN = 100;
const CM_MAX = 250;

function cmToIn(cm: number) {
  return cm / 2.54;
}
function inToCm(inches: number) {
  return inches * 2.54;
}
function ftInToCm(feet: number, inches: number) {
  return (feet * 12 + inches) * 2.54;
}
function cmToFtIn(cm: number) {
  const totalIn = cmToIn(cm);
  const feet = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn - feet * 12);
  return inches === 12 ? { feet: feet + 1, inches: 0 } : { feet, inches };
}

// A single canonical value — centimeters, stored as a string so an empty
// onboarding field stays empty rather than becoming "0" — displayed and
// edited in whichever unit the user picked. Typing in any unit immediately
// updates the same canonical `valueCm`, so there's only ever one stored
// height, never three conflicting ones.
export function HeightUnitInput({
  valueCm,
  onChangeCm,
  unit,
  onUnitChange,
}: {
  valueCm: string;
  onChangeCm: (cm: string) => void;
  unit: HeightUnit;
  onUnitChange: (unit: HeightUnit) => void;
}) {
  const cmNum = valueCm ? Number(valueCm) : null;
  const outOfRange = cmNum !== null && (cmNum < CM_MIN || cmNum > CM_MAX);

  function setFromCm(cm: number | null) {
    if (cm === null || Number.isNaN(cm)) {
      onChangeCm("");
      return;
    }
    onChangeCm(String(Math.round(cm)));
  }

  const ftIn = cmNum ? cmToFtIn(cmNum) : null;

  return (
    <div>
      <div className="inline-flex rounded-full border border-line p-0.5 mb-3">
        {UNITS.map((u) => (
          <button
            key={u.key}
            type="button"
            onClick={() => onUnitChange(u.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              unit === u.key ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
            )}
          >
            {u.label}
          </button>
        ))}
      </div>

      {unit === "cm" && (
        <div className="flex items-center gap-2 max-w-[160px]">
          <input
            type="number"
            inputMode="numeric"
            value={valueCm}
            onChange={(e) => setFromCm(e.target.value ? Number(e.target.value) : null)}
            placeholder="170"
            className="w-full rounded-xl border border-line bg-paper-alt px-4 py-2.5 text-sm text-ink placeholder:text-stone outline-none transition-colors focus:border-ink"
          />
          <span className="text-sm text-stone shrink-0">cm</span>
        </div>
      )}

      {unit === "in" && (
        <div className="flex items-center gap-2 max-w-[160px]">
          <input
            type="number"
            inputMode="decimal"
            value={cmNum ? Math.round(cmToIn(cmNum) * 10) / 10 : ""}
            onChange={(e) => setFromCm(e.target.value ? inToCm(Number(e.target.value)) : null)}
            placeholder="67"
            className="w-full rounded-xl border border-line bg-paper-alt px-4 py-2.5 text-sm text-ink placeholder:text-stone outline-none transition-colors focus:border-ink"
          />
          <span className="text-sm text-stone shrink-0">in</span>
        </div>
      )}

      {unit === "ftin" && (
        <div className="flex items-center gap-2 max-w-[220px]">
          <input
            type="number"
            inputMode="numeric"
            value={ftIn?.feet ?? ""}
            onChange={(e) => {
              const feet = e.target.value ? Number(e.target.value) : 0;
              setFromCm(ftInToCm(feet, ftIn?.inches ?? 0));
            }}
            placeholder="5"
            className="w-16 rounded-xl border border-line bg-paper-alt px-3 py-2.5 text-sm text-ink placeholder:text-stone outline-none transition-colors focus:border-ink"
          />
          <span className="text-sm text-stone shrink-0">ft</span>
          <input
            type="number"
            inputMode="numeric"
            value={ftIn?.inches ?? ""}
            onChange={(e) => {
              const inches = e.target.value ? Number(e.target.value) : 0;
              setFromCm(ftInToCm(ftIn?.feet ?? 0, inches));
            }}
            placeholder="8"
            className="w-16 rounded-xl border border-line bg-paper-alt px-3 py-2.5 text-sm text-ink placeholder:text-stone outline-none transition-colors focus:border-ink"
          />
          <span className="text-sm text-stone shrink-0">in</span>
        </div>
      )}

      {cmNum && !outOfRange && (
        <p className="text-xs text-stone mt-2">
          {unit !== "cm" && `${Math.round(cmNum)} cm`}
          {unit !== "ftin" && ftIn && ` · ${ftIn.feet}'${ftIn.inches}"`}
          {unit !== "in" && ` · ${Math.round(cmToIn(cmNum) * 10) / 10} in`}
        </p>
      )}
      {outOfRange && <p className="text-xs text-warning mt-2">That doesn&apos;t look like a typical height — double check it.</p>}
    </div>
  );
}
