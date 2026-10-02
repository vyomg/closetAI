import Link from "next/link";
import { cn } from "@/lib/cn";

// matchin's mark: a four-point spark. Not decoration — the spark IS the
// product's vocabulary for "this works" (a match, a recommendation, a
// moment of style intelligence clicking into place). Deliberately
// asymmetric (the top point runs slightly longer/offset from center) for a
// touch of hand-drawn character rather than a perfectly regular ✦ glyph,
// while staying simple enough to read at favicon size.
export function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M15 0 Q17.5 13.5 30 15.5 Q18 17.5 16 30 Q14 17.5 2 16 Q14 13.5 15 0 Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Kept as an alias so existing call sites (favicon, loading states, nav)
// that reference "the mark" don't need to know it's a spark under the hood.
export const BrandMark = Spark;

// The wordmark is always lowercase with the apostrophe — "matchin'" — per
// brand: this is the one correct spelling everywhere, including at the
// start of a sentence. Uppercase ("MATCHIN'") is reserved for tiny
// all-caps UI labels, handled at the call site, not here.
export function BrandWordmark({ className, showSpark = false }: { className?: string; showSpark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-display tracking-tight lowercase", className)}>
      matchin&apos;
      {showSpark && <Spark className="h-[0.55em] w-[0.55em] text-lime shrink-0" />}
    </span>
  );
}

// The full lockup — spark mark + wordmark — used in the sidebar, loading
// screen, landing header and public share pages. Pass `href` to make it a
// link (e.g. "/" or "/dashboard"); omit for a static lockup where
// navigation makes no sense (the loading screen).
export function Brand({
  href,
  size = "md",
  className,
  markClassName,
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  markClassName?: string;
}) {
  const dims = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";

  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandWordmark className={text} />
      <Spark className={cn(dims, "text-lime shrink-0", markClassName)} />
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  );
}

// A branded loading moment for genuine in-page data loading — dropped in
// wherever a page already blocks on a fetch before it has anything to show.
// Deliberately a plain component, not a Next.js `loading.tsx` file: an
// app-wide route-level loading boundary was tried once and it silently
// downgraded server-side redirect() calls (e.g. the dashboard's onboarding
// redirect) from a clean HTTP 307 into a slower client-assisted one, so this
// renders only where a page's own client-side fetch state decides to show
// it — never intercepting routing or redirects, and never on a fixed timer.
export function BrandLoading({ tagline = "finding your fit...", className }: { tagline?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-20", className)}>
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <Spark className="h-6 w-6 text-lime animate-spark-spin" />
        <p className="font-display text-base lowercase text-ink-soft">
          matchin&apos; <span className="text-lime">✦</span>
        </p>
        <p className="text-xs text-stone lowercase">{tagline}</p>
      </div>
    </div>
  );
}
