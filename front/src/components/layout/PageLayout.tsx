import { type ReactNode } from "react";
import { IconBell, IconUserCircle, IconSearch, IconPlus } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PageLayoutProps {
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  addLabel: string;
  children: ReactNode;
  loading?: boolean;
}

export function PageLayout({
  title,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onAdd,
  addLabel,
  children,
  loading = false,
}: PageLayoutProps) {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4 text-lg font-semibold">
          <span className="text-muted-foreground">{title}</span>
        </div>

        <div className="flex items-center gap-5 text-muted-foreground">
          <button className="relative transition-colors hover:text-foreground">
            <IconBell size={20} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
          </button>

          <button className="transition-colors hover:text-foreground">
            <IconUserCircle size={20} />
          </button>
        </div>
      </header>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button onClick={onAdd} loading={loading}>
          <IconPlus size={16} />
          {addLabel}
        </Button>
      </div>

      {children}
    </main>
  );
}
