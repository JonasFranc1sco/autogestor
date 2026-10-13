import { type ReactNode, useEffect } from "react";
import { IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  loading?: boolean;
  maxWidth?: string;
  zIndex?: string;
  hideSubmit?: boolean;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = "Salvar",
  loading = false,
  maxWidth = "max-w-lg",
  zIndex = "z-50",
  hideSubmit = false,
}: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div
        className={`relative ${zIndex} w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-2xl border border-border bg-background p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150`}
      >
        <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 py-1">{children}</div>

        <div className="mt-4 flex justify-end gap-3 border-t border-border/40 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {hideSubmit ? "Fechar" : "Cancelar"}
          </Button>
          {!hideSubmit && onSubmit && (
            <Button type="button" onClick={onSubmit} loading={loading}>
              {submitLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
