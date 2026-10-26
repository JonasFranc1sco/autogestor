import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  IconCar,
  IconHome,
  IconUsers,
  IconClipboardList,
  IconBox,
  IconTool,
  IconUser,
  IconLogout,
  IconX,
  IconPackage,
  IconCalendar,
  IconCash,
  IconChartBar,
  IconSettings,
  IconUserCog,
  IconFileDollar,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ProfileDialog } from "@/components/layout/ProfileDialog";

interface SidebarProps {
  onNavigate?: () => void;
  onCloseMobile?: () => void;
  mobileOpen?: boolean;
}

export function Sidebar({ onNavigate, onCloseMobile, mobileOpen = false }: SidebarProps) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const isAdminOrManager = user?.role === "ADMIN" || user?.role === "MANAGER";

  const navItems: { icon: typeof IconHome; label: string; to: string; adminOnly?: boolean }[] = [
    { icon: IconHome, label: "Dashboard", to: "/" },
    { icon: IconUsers, label: "Clientes", to: "/clientes" },
    { icon: IconClipboardList, label: "Ordens de Serviço", to: "/os" },
    { icon: IconFileDollar, label: "Orçamento", to: "/orcamento" },
    { icon: IconCar, label: "Veículos", to: "/veiculos" },
    { icon: IconBox, label: "Produtos", to: "/produtos" },
    { icon: IconTool, label: "Serviços", to: "/servicos" },
    { icon: IconPackage, label: "Estoque", to: "/estoque" },
    { icon: IconCalendar, label: "Agenda", to: "/agenda" },
    { icon: IconCash, label: "Caixa", to: "/caixa" },
    { icon: IconChartBar, label: "Relatórios", to: "/relatorios", adminOnly: true },
    { icon: IconUsers, label: "Funcionários", to: "/funcionarios", adminOnly: true },
    { icon: IconUserCog, label: "Usuários", to: "/usuarios", adminOnly: true },
    { icon: IconSettings, label: "Configurações", to: "/configuracoes", adminOnly: true },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdminOrManager);

  return (
    <aside
      className={`flex w-[260px] shrink-0 flex-col border-r border-border bg-surface p-4 print:hidden max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:transition-transform ${
        mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
      }`}
    >
      <div className="mb-10 flex items-center justify-between">
        <div className="flex flex-col items-center flex-1">
          <IconCar
            size={32}
            className="mb-2 text-primary animate-logo-pulse"
            stroke={2}
          />
          <div className="text-xl font-bold tracking-wide">
            AUTO<span className="text-primary">GESTOR</span>
          </div>
        </div>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Fechar menu"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
          >
            <IconX size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1" aria-label="Navegação principal">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? "border border-primary/20 bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                    }`
                  }
                >
                  <Icon size={18} stroke={1.8} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-border pt-4">
        <div className="mb-3">
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Abrir meu perfil"
            title="Meu perfil"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <IconUser size={18} className="text-muted-foreground" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold">{user?.full_name || "Usuário"}</p>
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
            onClick={() => void logout()}
            className="text-muted-foreground transition-colors hover:text-destructive"
            title="Sair"
            aria-label="Sair da conta"
          >
            <IconLogout size={16} />
          </button>
        </div>
      </div>

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </aside>
  );
}
