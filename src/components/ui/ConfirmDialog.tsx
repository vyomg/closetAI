"use client";

import { Button } from "@/components/ui/Button";

// A small, generic confirmation sheet/modal — reuses the same overlay
// pattern already used by ItemPickerModal (OutfitGenerator) and the
// Calendar's outfit picker: bottom sheet on mobile, centered on desktop.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onCancel}
    >
      <div
        className="bg-paper rounded-t-3xl sm:rounded-2xl max-w-sm w-full p-6"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-xl mb-2">{title}</p>
        {description && <p className="text-sm text-stone mb-6">{description}</p>}
        <div className="flex items-center justify-end gap-2.5 mt-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "outline" : "primary"}
            size="sm"
            onClick={onConfirm}
            className={destructive ? "border-warning text-warning hover:border-warning" : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
