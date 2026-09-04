import { cn } from "@/lib/cn";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "warning" | "success" }) {
  const toneClasses = {
    neutral: "bg-paper-alt text-ink-soft",
    warning: "bg-[#f4e6d8] text-warning",
    success: "bg-[#e3ebe0] text-success",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
        toneClasses,
        className
      )}
      {...props}
    />
  );
}
