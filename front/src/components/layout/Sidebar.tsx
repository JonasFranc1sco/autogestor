import {
  IconCar,
  IconHome,
  IconUsers,
  IconClipboardList,
  IconBox,
  IconDollarSign,
  IconChartBar,
  IconCalendar,
  IconSettings,
  IconUser,
  IconLogout,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: IconHome, label: "Dashboard", active: true },
  { icon: IconUsers, label: "Clientes" },
  { icon: IconClipboardList, label: "Ordem de Serviço" },
  { icon: IconCar, label: "Veículos" },
  { icon: IconBox, label: "Produtos" },
  { icon: IconDollarSign, label: "Financeiro" },
  { icon: IconChartBar, label: "Relatórios" },
  { icon: IconCalendar, label: "Agenda" },
  { icon: IconSettings, label: "Configurações" },
];

export function Sidebar() {
  const { setAccessToken } = useAuth();

  function handleLogout() {
    setAccessToken(null);
  }

  return (
    <aside className="flex w-[260px] flex-col border-r border-border bg-surface p-4">
      <div className="mb-10 flex flex-col items-center">
        <IconCar
          size={32}
          className="mb-2 text-primary animate-logo-pulse"
          stroke={2}
        />

        <div className="text-xl font-bold tracking-wide">
          AUTO<span className="text-primary">GESTOR</span>
        </div>
      </div>

      <nav className="flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <button
                  className={`flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    item.active
                      ? "border border-primary/20 bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  <Icon size={18} stroke={1.8} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <IconUser size={18} className="text-muted-foreground" />
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold">Vitor Gabriel</p>
            <p className="text-xs text-primary">Administrador</p>
          </div>

          <button
            onClick={handleLogout}
            className="text-muted-foreground transition-colors hover:text-destructive"
            title="Sair"
          >
            <IconLogout size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
