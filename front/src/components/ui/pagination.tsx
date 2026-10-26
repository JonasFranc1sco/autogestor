import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { DEFAULT_PAGE_SIZE, getPageItems } from "@/services/pagination";

export interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalCount,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
  itemLabel = "registro(s)",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalCount);
  const pageItems = getPageItems(safePage, totalPages);

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs text-muted-foreground">
        Exibindo <span className="font-medium text-foreground">{startItem}–{endItem}</span> de{" "}
        <span className="font-medium text-foreground">{totalCount}</span> {itemLabel}
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Página anterior"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          <IconChevronLeft size={14} />
          <span>Anterior</span>
        </button>

        {pageItems.map((item) => {
          if (item === "ellipsis-start" || item === "ellipsis-end") {
            return (
              <span
                key={item}
                aria-hidden="true"
                className="inline-flex h-8 min-w-8 items-center justify-center px-1 text-xs text-muted-foreground select-none"
              >
                …
              </span>
            );
          }

          const isActive = item === safePage;
          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                if (!isActive) onPageChange(item);
              }}
              aria-label={`Página ${item}`}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-primary px-2.5 text-xs font-semibold text-primary-foreground shadow-xs"
                  : "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              }
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Próxima página"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          <span>Próxima</span>
          <IconChevronRight size={14} />
        </button>
      </div>
    </nav>
  );
}
