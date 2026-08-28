import {
  IconCar,
  IconHome,
  IconUsers,
  IconClipboardList,
  IconBox,
  IconCash,
  IconChartBar,
  IconCalendar,
  IconSettings,
  IconUser,
  IconLogout,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";

export type Page = "dashboard" | "clientes" | "veiculos" | "produtos" | "funcionarios";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const isAdminOrManager = user?.role === "ADMIN" || user?.role === "MANAGER";

  const navItems: { icon: typeof IconHome; label: string; page: Page; adminOnly?: boolean }[] = [
    { icon: IconHome, label: "Dashboard", page: "dashboard" },
    { icon: IconUsers, label: "Clientes", page: "clientes" },
    { icon: IconClipboardList, label: "Ordem de Serviço", page: "dashboard" },
    { icon: IconCar, label: "Veículos", page: "veiculos" },
    { icon: IconBox, label: "Produtos", page: "produtos" },
    { icon: IconUsers, label: "Funcionários", page: "funcionarios", adminOnly: true },
    { icon: IconCash, label: "Financeiro", page: "dashboard" },
    { icon: IconChartBar, label: "Relatórios", page: "dashboard" },
    { icon: IconCalendar, label: "Agenda", page: "dashboard" },
    { icon: IconSettings, label: "Configurações", page: "dashboard" },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdminOrManager);

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
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page && item.page !== "dashboard";

            return (
              <li key={item.label}>
                <button
                  onClick={() => onNavigate(item.page)}
                  className={`flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    isActive
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
            <p className="text-sm font-semibold">{user?.full_name || "Usuário"}</p>
            <p className="text-xs text-primary">
              {user?.role === "ADMIN"
                ? "Administrador"
                : user?.role === "MANAGER"
                  ? "Gerente"
                  : user?.role === "MECHANIC"
                    ? "Mecânico"
                    : "Atendente"}
            </p>
          </div>

          <button
            onClick={logout}
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
