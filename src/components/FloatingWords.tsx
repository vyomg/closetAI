import { cn } from "@/lib/cn";

// Small editorial accent for a handful of hero sections — tiny tilted words
// that bob gently around a big title. Deliberately restrained: used on at
// most one section per page, capped at 4 words, positioned at the edges so
// they never sit over body text or a button, and `pointer-events-none` so
// they can never intercept a click. `prefers-reduced-motion` turns the bob
// off via the `.animate-float-word` rule in globals.css — the words still
// render, just static.
// Each word straddles its container's own edge by half a line (translate
// 50%) rather than bleeding a fixed distance past it — so however tall the
// parent card turns out to be, a word can never drift down into whatever
// section happens to sit below it on the page.
const POSITIONS = [
  "top-0 left-3 -translate-y-1/2 [--float-rot:-9deg]",
  "top-0 right-3 -translate-y-1/2 [--float-rot:7deg]",
  "bottom-0 left-[12%] translate-y-1/2 [--float-rot:5deg]",
  "bottom-0 right-[10%] translate-y-1/2 [--float-rot:-6deg]",
];

export function FloatingWords({ words, className }: { words: string[]; className?: string }) {
  const picked = words.slice(0, 4);
  return (
    <div className={cn("pointer-events-none absolute inset-0 hidden sm:block overflow-hidden", className)} aria-hidden>
      {picked.map((word, i) => (
        <span
          key={word}
          className={cn(
            "absolute font-display text-xs lg:text-sm uppercase tracking-[0.18em] text-lime/50 animate-float-word select-none",
            POSITIONS[i % POSITIONS.length]
          )}
          style={{ animationDelay: `${i * 0.7}s` }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}
