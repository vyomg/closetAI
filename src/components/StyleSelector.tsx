"use client";

import { Chip } from "@/components/ui/Chip";

export function StyleSelector({
  options,
  selected,
  onChange,
  multiple = true,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
}) {
  function toggle(option: string) {
    if (multiple) {
      onChange(selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option]);
    } else {
      onChange([option]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((option) => (
        <Chip key={option} active={selected.includes(option)} onClick={() => toggle(option)}>
          {option}
        </Chip>
      ))}
    </div>
  );
}
