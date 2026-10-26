import { type ReactNode } from "react";
import { IconSearch, IconPlus } from "@tabler/icons-react";
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
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold">{title}</h1>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            aria-label={searchPlaceholder}
          />
        </div>

        <Button onClick={onAdd} loading={loading} className="w-full sm:w-auto">
          <IconPlus size={16} />
          {addLabel}
        </Button>
      </div>

      {children}
    </main>
  );
}
