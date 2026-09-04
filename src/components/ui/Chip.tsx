import { cn } from "@/lib/cn";

export function Chip({
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border px-4 py-2 text-sm transition-colors duration-150 cursor-pointer",
        active
          ? "border-ink bg-ink text-paper"
          : "border-line bg-white text-ink-soft hover:border-ink/40",
        className
      )}
      {...props}
    />
  );
}
