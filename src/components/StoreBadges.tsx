import { Apple, PlayCircle } from "lucide-react";
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/appStoreLinks";
import { cn } from "@/lib/cn";

// Renders as a real link once a store URL is configured; otherwise a
// disabled, honestly-labeled "Coming soon" affordance — never a link to a
// placeholder or unrelated app.
function StoreBadge({
  href,
  icon,
  eyebrow,
  label,
  dark,
}: {
  href: string | null;
  icon: React.ReactNode;
  eyebrow: string;
  label: string;
  dark?: boolean;
}) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left transition-colors",
        dark ? "border-white/15" : "border-line"
      )}
    >
      {icon}
      <span>
        <span className={cn("block text-[10px] uppercase tracking-wide leading-none", dark ? "text-white/40" : "text-stone")}>{eyebrow}</span>
        <span className={cn("block text-sm font-medium leading-tight mt-0.5", dark && "text-white")}>{href ? label : "Coming soon"}</span>
      </span>
    </span>
  );

  if (!href) {
    return <span className="opacity-50 cursor-not-allowed" aria-disabled title="Not yet available">{content}</span>;
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={dark ? "hover:border-white/40 transition-colors" : "hover:border-ink/40 transition-colors"}>
      {content}
    </a>
  );
}

export function StoreBadges({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={className}>
      <StoreBadge href={APP_STORE_URL} icon={<Apple className="h-5 w-5" strokeWidth={1.5} />} eyebrow="Download on the" label="App Store" dark={dark} />
      <StoreBadge href={GOOGLE_PLAY_URL} icon={<PlayCircle className="h-5 w-5" strokeWidth={1.5} />} eyebrow="Get it on" label="Google Play" dark={dark} />
    </div>
  );
}
