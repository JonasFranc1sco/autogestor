import { useCallback, useEffect, useId, useRef, useState } from "react";
import { IconChevronDown, IconLoader2, IconPlus, IconX } from "@tabler/icons-react";

export interface SearchableOption {
  id: string;
  primary: string;
  secondary?: string;
}

interface SearchableSelectProps {
  label: string;
  value: string | null;
  onChange: (id: string | null, option: SearchableOption | null) => void;
  searchOptions: (term: string) => Promise<SearchableOption[]>;
  optional?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  createLabel?: string;
  onCreate?: () => void;
  /** Texto exibido para o valor selecionado antes de qualquer busca (ex.: dono já carregado). */
  initialLabel?: string | null;
}

const DEBOUNCE_MS = 300;

export function SearchableSelect({
  label,
  value,
  onChange,
  searchOptions,
  optional = false,
  error,
  disabled = false,
  placeholder = "Digite para buscar...",
  createLabel,
  onCreate,
  initialLabel = null,
}: SearchableSelectProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [options, setOptions] = useState<SearchableOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [selected, setSelected] = useState<SearchableOption | null>(null);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  // Mantém o rótulo do valor selecionado quando vem do exterior (ex.: edição).
  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    setSelected((current) => {
      const primary = initialLabel ?? current?.primary ?? "";
      if (current && current.id === value && current.primary === primary) return current;
      return { id: value, primary };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, initialLabel]);

  const updateRect = useCallback(() => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (bounds) setRect({ top: bounds.bottom + 4, left: bounds.left, width: bounds.width });
  }, []);

  const close = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setOpen(false);
    setTerm("");
  }, []);

  const onType = (input: string) => {
    setTerm(input);
    setOpen(true);
    updateRect();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSearch(input), DEBOUNCE_MS);
  };

  const runSearch = useCallback(
    async (searchTerm: string) => {
      const requestId = ++requestRef.current;
      setLoading(true);
      try {
        const results = await searchOptions(searchTerm);
        if (requestId !== requestRef.current) return;
        setOptions(results);
        setHighlight(results.length > 0 ? 0 : -1);
      } catch {
        if (requestId !== requestRef.current) return;
        setOptions([]);
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    },
    [searchOptions],
  );

  // Abertura do dropdown lista as opções iniciais.
  const openDropdown = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setTerm("");
    updateRect();
    void runSearch("");
  }, [disabled, runSearch, updateRect]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) close();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  function select(option: SearchableOption) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSelected(option);
    onChange(option.id, option);
    setOpen(false);
    setTerm("");
  }

  function clear() {
    setSelected(null);
    onChange(null, null);
    setTerm("");
    setOptions([]);
    setHighlight(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      event.preventDefault();
      openDropdown();
      return;
    }
    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((current) => (current + 1) % Math.max(options.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) => (current <= 0 ? options.length - 1 : current - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = options[highlight];
      if (option) select(option);
    }
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="flex items-center gap-1 text-sm font-medium">
        {label}
        {optional && <span className="ml-1 text-xs text-muted-foreground">(opcional)</span>}
      </label>

      <div ref={containerRef} className="relative">
        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <input
              id={inputId}
              role="combobox"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={open && highlight >= 0 && options[highlight] ? `${listboxId}-${options[highlight].id}` : undefined}
              aria-invalid={Boolean(error)}
              disabled={disabled}
              autoComplete="off"
              placeholder={selected ? selected.primary : placeholder}
              value={open ? term : selected?.primary ?? ""}
              onFocus={() => {
                if (selected) setTerm("");
                openDropdown();
              }}
              onBlur={() => {
                // Composição com onMouseDown(preventDefault) nos itens: só fecha
                // quando o foco sai de verdade do campo.
                if (!containerRef.current?.contains(document.activeElement)) close();
              }}
              onChange={(event) => onType(event.target.value)}
              onKeyDown={onKeyDown}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 pr-8 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            />

            {loading ? (
              <IconLoader2 size={14} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : selected && !disabled ? (
              <button
                type="button"
                onClick={clear}
                aria-label={`Limpar ${label}`}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <IconX size={14} />
              </button>
            ) : (
              <IconChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </div>

          {onCreate && !disabled && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                close();
                onCreate();
              }}
              title={createLabel ?? "Novo registro"}
              aria-label={createLabel ?? "Novo registro"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            >
              <IconPlus size={16} />
            </button>
          )}
        </div>

        {open && rect && (
          <ul
            id={listboxId}
            role="listbox"
            style={{ position: "fixed", top: rect.top, left: rect.left, width: rect.width }}
            className="z-[80] max-h-60 overflow-auto rounded-lg border border-border bg-popover shadow-lg"
          >
            {loading && options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground" role="presentation">
                Carregando...
              </li>
            ) : options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground" role="presentation">
                Nenhum resultado encontrado.
              </li>
            ) : (
              options.map((option, index) => (
                <li
                  key={option.id}
                  id={`${listboxId}-${option.id}`}
                  role="option"
                  aria-selected={selected?.id === option.id}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    select(option);
                  }}
                  className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                    index === highlight ? "bg-primary/10 text-primary" : "text-foreground"
                  }`}
                >
                  <p className="font-medium">{option.primary}</p>
                  {option.secondary && (
                    <p className="text-xs text-muted-foreground">{option.secondary}</p>
                  )}
                </li>
              ))
            )}

          </ul>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
