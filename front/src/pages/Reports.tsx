import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconChartBar, IconCash, IconClipboardList, IconTool, IconBox, IconUser, IconDownload } from "@tabler/icons-react";
import { FormField } from "@/components/ui/form";
import { getReports, type ReportsData } from "@/services/report.service";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/services/serviceOrder.service";
import { formatCurrency } from "@/lib/format";
import { extractApiErrorMessage } from "@/lib/errors";

function localDateISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function firstDayOfMonthISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(firstDayOfMonthISO);
  const [dateTo, setDateTo] = useState(localDateISO);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getReports(dateFrom, dateTo)
      .then((response) => {
        if (active) setData(response);
      })
      .catch((error) => {
        toast.error(extractApiErrorMessage(error, "Não foi possível carregar os relatórios."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dateFrom, dateTo]);

  function exportCsv() {
    if (!data) return;
    const rows: string[] = ["Relatorio;Valor"];
    rows.push(`Ordens criadas;${data.summary.orders}`);
    rows.push(`Ordens concluidas;${data.summary.done_orders}`);
    rows.push(`Ordens canceladas;${data.summary.cancelled_orders}`);
    rows.push(`Faturamento (concluidas);${data.summary.revenue_done}`);
    rows.push(`Recebido;${data.summary.received}`);
    rows.push("");
    rows.push("Servico;Quantidade;Total");
    for (const item of data.top_services) rows.push(`${item.name};${item.quantity};${item.total}`);
    rows.push("");
    rows.push("Produto;Quantidade;Total");
    for (const item of data.top_products) rows.push(`${item.name};${item.quantity};${item.total}`);
    rows.push("");
    rows.push("Mecanico;OS;Faturamento");
    for (const item of data.mechanic_productivity) rows.push(`${item.mechanic};${item.orders};${item.revenue}`);

    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-${data.period.date_from}-${data.period.date_to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const summaryCards = [
    { icon: IconClipboardList, label: "Ordens criadas", value: data?.summary.orders ?? 0 },
    { icon: IconChartBar, label: "Concluídas", value: data?.summary.done_orders ?? 0 },
    { icon: IconCash, label: "Faturamento (concluídas)", value: formatCurrency(data?.summary.revenue_done ?? 0) },
    { icon: IconCash, label: "Recebido no período", value: formatCurrency(data?.summary.received ?? 0) },
  ];

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Desempenho da oficina por período</p>
        </div>
        <div className="flex gap-4">
          <div className="w-40">
            <FormField label="De" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="w-40">
            <FormField label="Até" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!data}
            className="flex h-10 items-center gap-2 self-end rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            <IconDownload size={16} /> Exportar CSV
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconLoader2 size={18} className="animate-spin" /> Carregando relatórios...
        </div>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Sem dados para o período selecionado.</p>
      ) : (
        <>
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-2xl border border-border bg-surface p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="mt-1 text-2xl font-bold">{card.value}</p>
                    </div>
                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                      <Icon size={20} stroke={1.8} />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <IconTool size={18} /> Serviços mais vendidos
              </h2>
              {data.top_services.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem serviços no período.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2">Serviço</th>
                      <th className="py-2 text-right">Qtd.</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_services.map((item) => (
                      <tr key={item.name} className="border-b border-border/50 last:border-0">
                        <td className="py-2">{item.name}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <IconBox size={18} /> Peças mais vendidas
              </h2>
              {data.top_products.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem peças no período.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2">Produto</th>
                      <th className="py-2 text-right">Qtd.</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_products.map((item) => (
                      <tr key={item.name} className="border-b border-border/50 last:border-0">
                        <td className="py-2">{item.name}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <IconUser size={18} /> Produtividade por mecânico
              </h2>
              {data.mechanic_productivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem OS com mecânico no período.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2">Mecânico</th>
                      <th className="py-2 text-right">OS</th>
                      <th className="py-2 text-right">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.mechanic_productivity.map((item) => (
                      <tr key={item.mechanic} className="border-b border-border/50 last:border-0">
                        <td className="py-2">{item.mechanic}</td>
                        <td className="py-2 text-right">{item.orders}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <IconCash size={18} /> Recebimentos por forma
              </h2>
              {data.payments_by_method.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem pagamentos no período.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2">Forma</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments_by_method.map((item) => (
                      <tr key={item.method} className="border-b border-border/50 last:border-0">
                        <td className="py-2">
                          {PAYMENT_METHOD_LABELS[item.method as PaymentMethod] ?? item.method}
                        </td>
                        <td className="py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
