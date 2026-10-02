import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

// Consistent "Clear all" / "Reset" affordance used wherever multiple
// selections or filters can be active — only ever renders when there is
// actually something to clear, and never does anything on its own besides
// call the caller's onClick (it never knows what "clearing" means for a
// given panel, so it can't accidentally reset unrelated state).
export function ClearButton({
  show,
  onClick,
  label = "Clear all",
  className,
}: {
  show: boolean;
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  if (!show) return null;
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn("text-ink-soft hover:text-ink", className)}
    >
      {label}
    </Button>
  );
}
