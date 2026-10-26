import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconCash, IconLoader2 } from "@tabler/icons-react";
import { getCashRegister, type CashRegisterData } from "@/services/cash.service";
import { formatCurrency } from "@/lib/format";
import { extractApiErrorMessage } from "@/lib/errors";
import { FormField } from "@/components/ui/form";

function localDateISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function CashRegisterPage() {
  const [data, setData] = useState<CashRegisterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(localDateISO);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getCashRegister(date)
      .then((response) => {
        if (active) setData(response);
      })
      .catch((error) => {
        toast.error(extractApiErrorMessage(error, "Não foi possível carregar o caixa."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [date]);

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Caixa</h1>
          <p className="text-sm text-muted-foreground">Fechamento diário por forma de pagamento</p>
        </div>
        <div className="w-full max-w-xs">
          <FormField
            label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconLoader2 size={18} className="animate-spin" /> Carregando caixa...
        </div>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Sem dados para a data selecionada.</p>
      ) : (
        <>
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total recebido</p>
                  <p className="mt-1 text-2xl font-bold">{formatCurrency(data.total)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{data.payments_count} pagamento(s)</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <IconCash size={20} stroke={1.8} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Forma de pagamento</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.methods.map((method) => (
                  <tr key={method.method} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3">{method.label}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(method.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="px-4 py-3 font-semibold">Total do dia</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(data.total)}</td>
                </tr>
              </tfoot>
            </table>
          </section>
        </>
      )}
    </main>
  );
}
