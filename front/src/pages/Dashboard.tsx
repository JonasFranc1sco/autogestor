import {
  IconBell,
  IconUserCircle,
  IconCalendar,
  IconUserPlus,
  IconClipboardPlus,
  IconCar,
  IconBox,
  IconClipboardList,
  IconUsers,
  IconPackage,
} from "@tabler/icons-react";

const quickActions = [
  { icon: IconUserPlus, title: "Novo Cliente", description: "Cadastrar cliente" },
  { icon: IconClipboardPlus, title: "Nova OS", description: "Criar ordem de serviço" },
  { icon: IconCar, title: "Novo Veículo", description: "Cadastrar veículo" },
  { icon: IconBox, title: "Novo Produto", description: "Cadastrar produto" },
];

const summaryCards = [
  { icon: IconClipboardList, value: "12", label: "Ordens de Serviço", highlight: "Abertas" },
  { icon: IconCar, value: "8", label: "Veículos", highlight: "Em atendimento" },
  { icon: IconUsers, value: "45", label: "Clientes", highlight: "Cadastrados" },
  { icon: IconPackage, value: "128", label: "Produtos", highlight: "Em estoque" },
];

const recentOS = [
  { id: "#00048", client: "João Silva", vehicle: "Honda Civic", status: "progress" as const },
  { id: "#00047", client: "Maria Oliveira", vehicle: "Fiat Strada", status: "waiting" as const },
  { id: "#00046", client: "Carlos Souza", vehicle: "Chevrolet Onix", status: "client" as const },
  { id: "#00045", client: "Ana Pereira", vehicle: "Toyota Corolla", status: "done" as const },
];

const statusConfig = {
  progress: { label: "Em andamento", className: "bg-status-progress/10 text-status-progress" },
  waiting: { label: "Aguardando peças", className: "bg-status-waiting/10 text-status-waiting" },
  client: { label: "Aguardando cliente", className: "bg-status-client/10 text-status-client" },
  done: { label: "Concluída", className: "bg-status-done/10 text-status-done" },
};

function formatDate() {
  const now = new Date();
  const day = now.getDate();
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${day} de ${months[now.getMonth()]}, ${now.getFullYear()}`;
}

function formatDay() {
  return new Date().toLocaleDateString("pt-BR", { weekday: "long" });
}

export default function Dashboard() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4 text-lg font-semibold">
          <span className="text-muted-foreground">Dashboard</span>
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

      <section className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Olá, Vitor!</h1>
          <p className="text-sm text-muted-foreground">Aqui está o resumo geral da sua oficina.</p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-3">
          <IconCalendar size={18} className="text-muted-foreground" />
          <div className="text-xs">
            <p className="font-medium">{formatDate()}</p>
            <p className="text-muted-foreground capitalize">{formatDay()}</p>
          </div>
        </div>
      </section>

      <h2 className="mb-4 text-base font-semibold">Ações rápidas</h2>
      <div className="mb-8 grid grid-cols-4 gap-5">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-surface p-6 text-center transition-all hover:border-primary hover:-translate-y-0.5"
            >
              <div className="relative">
                <Icon size={32} className="text-primary" />
              </div>

              <div>
                <p className="text-sm font-semibold">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <h2 className="mb-4 text-base font-semibold">Resumo</h2>
      <div className="mb-8 grid grid-cols-4 gap-5">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
                <Icon size={20} className="text-primary" />
              </div>

              <div>
                <p className="text-2xl font-bold leading-none">{card.value}</p>
                <p className="text-xs text-muted-foreground">
                  {card.label}{" "}
                  <span className="text-primary">{card.highlight}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[1.2fr_1fr] gap-5">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold">Ordens de Serviço recentes</h2>
            <button className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:border-muted-foreground">
              Ver todas
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {recentOS.map((os) => (
              <div
                key={os.id}
                className="grid grid-cols-[80px_1.5fr_1.5fr_120px] items-center border-b border-foreground/5 py-3 text-[13px] last:border-b-0"
              >
                <span className="text-muted-foreground">{os.id}</span>
                <span>{os.client}</span>
                <span>{os.vehicle}</span>
                <span
                  className={`justify-self-end rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusConfig[os.status].className}`}
                >
                  {statusConfig[os.status].label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold">Atividade recente</h2>
            <button className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:border-muted-foreground">
              Ver tudo
            </button>
          </div>

          <div className="flex flex-col gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
              <div>
                <p>Nova OS <span className="font-semibold">#00048</span> criada</p>
                <p className="text-xs text-muted-foreground">Há 2 horas</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-status-done" />
              <div>
                <p>OS <span className="font-semibold">#00045</span> concluída</p>
                <p className="text-xs text-muted-foreground">Há 5 horas</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-status-client" />
              <div>
                <p>Novo cliente <span className="font-semibold">Carlos Souza</span> cadastrado</p>
                <p className="text-xs text-muted-foreground">Ontem</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-status-waiting" />
              <div>
                <p>Produto <span className="font-semibold">Filtro de óleo</span> com estoque baixo</p>
                <p className="text-xs text-muted-foreground">Ontem</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
