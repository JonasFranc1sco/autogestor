import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconUserPlus,
  IconClipboardPlus,
  IconCar,
  IconBox,
  IconClipboardList,
  IconUsers,
  IconPackage,
  IconCash,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboard, type DashboardData } from "@/services/dashboard.service";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  STATUS_LABELS,
  type ServiceOrderStatus,
} from "@/services/serviceOrder.service";
import { toast } from "sonner";

const statusClasses: Record<ServiceOrderStatus, string> = {
  OPEN: "bg-status-open/10 text-status-open",
  IN_PROGRESS: "bg-status-progress/10 text-status-progress",
  WAITING_PARTS: "bg-status-waiting/10 text-status-waiting",
  WAITING_CLIENT: "bg-status-client/10 text-status-client",
  DONE: "bg-status-done/10 text-status-done",
  CANCELLED: "bg-status-cancelled/10 text-status-cancelled",
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getDashboard()
      .then((response) => {
        if (active) setData(response);
      })
      .catch(() => {
        toast.error("Não foi possível carregar o dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const quickActions = [
    { icon: IconUserPlus, title: "Novo Cliente", to: "/clientes", action: "new" as const },
    { icon: IconClipboardPlus, title: "Nova OS", to: "/os", action: "new" as const },
    { icon: IconCar, title: "Novo Veículo", to: "/veiculos", action: "new" as const },
    { icon: IconBox, title: "Novo Produto", to: "/produtos", action: "new" as const },
  ];

  const summaryCards = [
    { icon: IconClipboardList, value: data?.counts.open_service_orders ?? 0, label: "OS Abertas", highlight: "Aguardando início" },
    { icon: IconCar, value: data?.counts.in_progress_service_orders ?? 0, label: "Em Atendimento", highlight: "Em andamento" },
    { icon: IconCash, value: formatCurrency(data?.revenue_this_month ?? 0), label: "Faturamento", highlight: "Este mês (concluídas)" },
    { icon: IconUsers, value: data?.counts.clients ?? 0, label: "Clientes", highlight: `${data?.counts.vehicles ?? 0} veículos` },
  ];

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-muted-foreground">Dashboard</h1>
          <p className="text-xl font-bold">
            {greeting()}, {user?.full_name?.split(" ")[0] ?? "usuário"}!
          </p>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold">{loading ? "—" : card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.highlight}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Icon size={20} stroke={1.8} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mb-8" aria-label="Ações rápidas">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Ações Rápidas</h2>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                type="button"
                onClick={() => navigate(action.to, { state: { openCreate: true } })}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Icon size={20} stroke={1.8} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{action.title}</p>
                  <p className="text-xs text-muted-foreground">Cadastrar</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Ordens de Serviço Recentes</h2>
            <button
              type="button"
              onClick={() => navigate("/os")}
              className="text-sm text-primary hover:underline"
            >
              Ver todas
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (data?.recent_service_orders.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ordem de serviço registrada.</p>
          ) : (
            <ul className="space-y-3">
              {data?.recent_service_orders.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/os/${order.id}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-foreground/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        OS #{order.number} — {order.client_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.vehicle_plate ?? "Sem placa"} · {formatDate(order.created_at)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[order.status as ServiceOrderStatus] ?? ""}`}>
                      {STATUS_LABELS[order.status as ServiceOrderStatus] ?? order.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <IconAlertTriangle size={18} className="text-status-waiting" />
              Estoque Baixo
            </h2>
            <button
              type="button"
              onClick={() => navigate("/produtos")}
              className="text-sm text-primary hover:underline"
            >
              Ver produtos
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (data?.low_stock_products.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum produto com estoque baixo.</p>
          ) : (
            <ul className="space-y-3">
              {data?.low_stock_products.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-lg bg-status-waiting/10 p-2 text-status-waiting">
                      <IconPackage size={16} stroke={1.8} />
                    </div>
                    <p className="truncate text-sm font-medium">{product.name}</p>
                  </div>
                  <p className="shrink-0 text-sm">
                    <span className="font-semibold text-status-waiting">{product.stock_quantity}</span>
                    <span className="text-muted-foreground"> / mín. {product.min_stock_quantity ?? 0}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
