import { type ReactNode, useEffect, useRef } from "react";

// Controle de modais empilhados: apenas o topo responde a Escape e gerencia o scroll do body.
let dialogSeq = 0;
const openDialogs = new Set<number>();
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
  destructive?: boolean;
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
  destructive = false,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const dialogIdRef = useRef(0);
  if (dialogIdRef.current === 0) dialogIdRef.current = ++dialogSeq;

  useEffect(() => {
    if (!open) return;

    const dialogId = dialogIdRef.current;
    openDialogs.add(dialogId);
    const isTop = () => Math.max(...openDialogs) === dialogId;

    if (isTop()) document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isTop()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);

    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      "input, select, textarea, button",
    );
    firstFocusable?.focus();

    return () => {
      openDialogs.delete(dialogId);
      if (openDialogs.size === 0) document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative ${zIndex} w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-2xl border border-border bg-background p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150`}
      >
        <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
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
            <Button
              type="button"
              onClick={onSubmit}
              loading={loading}
              variant={destructive ? "destructive" : "default"}
            >
              {submitLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
