import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
  /** Mostra o rótulo de texto ao lado do ícone (padrão do menu lateral). */
  showLabel?: boolean;
  onToggle?: () => void;
}

export function ThemeToggle({ showLabel = true, onToggle }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = nextTheme === "dark" ? "Usar tema escuro" : "Usar tema claro";
  const Icon = nextTheme === "dark" ? IconMoon : IconSun;

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    toggleTheme({ x: event.clientX, y: event.clientY });
    onToggle?.();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={`flex w-full items-center gap-4 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground ${
        showLabel ? "" : "justify-center px-2"
      }`}
    >
      <Icon size={18} stroke={1.8} />
      {showLabel && (nextTheme === "dark" ? "Tema escuro" : "Tema claro")}
    </button>
  );
}
