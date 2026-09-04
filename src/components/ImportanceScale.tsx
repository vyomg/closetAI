"use client";

import { cn } from "@/lib/cn";

export function ImportanceScale({
  value,
  onChange,
  lowLabel = "Not important",
  highLabel = "Very important",
}: {
  value: number;
  onChange: (next: number) => void;
  lowLabel?: string;
  highLabel?: string;
}) {
  return (
    <div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "h-11 flex-1 rounded-xl border text-sm font-medium transition-colors cursor-pointer",
              n === value ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink-soft hover:border-ink/40"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-stone">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
