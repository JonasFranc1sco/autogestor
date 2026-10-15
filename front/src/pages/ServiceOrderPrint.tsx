import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { IconLoader2, IconPrinter, IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  getServiceOrder,
  STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type ServiceOrder,
} from "@/services/serviceOrder.service";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/format";
import { extractApiErrorMessage } from "@/lib/errors";

export default function ServiceOrderPrintPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getServiceOrder(id)
      .then(setOrder)
      .catch((error) => {
        toast.error(extractApiErrorMessage(error, "Não foi possível carregar a ordem de serviço."));
        navigate("/os");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconLoader2 size={18} className="animate-spin" /> Carregando...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <Button variant="outline" onClick={() => navigate(`/os/${order.id}`)}>
            <IconArrowLeft size={16} /> Voltar
          </Button>
          <Button onClick={() => window.print()}>
            <IconPrinter size={16} /> Imprimir
          </Button>
        </div>

        <article className="rounded-2xl border border-border bg-surface p-8 print:rounded-none print:border-0">
          <header className="mb-6 flex items-start justify-between border-b border-border pb-4">
            <div>
              <h1 className="text-xl font-bold">
                {user?.workshop?.name ?? "Oficina"}
              </h1>
              {user?.workshop?.cnpj && (
                <p className="text-sm text-muted-foreground">CNPJ: {user.workshop.cnpj}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">OS #{order.number}</p>
              <p className="text-sm text-muted-foreground">
                Aberta em {formatDateTime(order.opened_at ?? order.created_at)}
              </p>
              <p className="text-sm text-muted-foreground">
                Status: {STATUS_LABELS[order.status]}
              </p>
            </div>
          </header>

          <section className="mb-6 grid grid-cols-2 gap-6">
            <div>
              <h2 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Cliente</h2>
              <p className="font-medium">{order.client.name}</p>
              <p className="text-sm text-muted-foreground">{order.client.document ?? ""}</p>
            </div>
            <div>
              <h2 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Veículo</h2>
              <p className="font-medium">
                {order.vehicle.brand} {order.vehicle.model}
              </p>
              <p className="text-sm text-muted-foreground">
                Placa: {order.vehicle.license_plate ?? "—"}
                {order.odometer ? ` · ${order.odometer} km` : ""}
              </p>
            </div>
          </section>

          {order.description && (
            <section className="mb-6">
              <h2 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Descrição do serviço
              </h2>
              <p className="text-sm">{order.description}</p>
            </section>
          )}

          <section className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Serviços</h2>
            {(order.services ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum serviço registrado.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2">Serviço</th>
                    <th className="py-2 text-right">Preço</th>
                    <th className="py-2 text-right">Desconto</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.services ?? []).map((item) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-2">{item.service?.name ?? "Serviço"}</td>
                      <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                      <td className="py-2 text-right">{formatCurrency(item.discount ?? 0)}</td>
                      <td className="py-2 text-right">{formatCurrency(item.total_price ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Peças</h2>
            {(order.products ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma peça registrada.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2">Produto</th>
                    <th className="py-2 text-right">Qtd.</th>
                    <th className="py-2 text-right">Preço</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.products ?? []).map((item) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-2">{item.product?.name ?? "Produto"}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                      <td className="py-2 text-right">{formatCurrency(item.total_price ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="mb-6 flex justify-end">
            <div className="w-64 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatCurrency(order.total_price)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Pago</span>
                <span>{formatCurrency(order.paid_total ?? 0)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-semibold">Saldo</span>
                <span className="font-semibold">{formatCurrency(order.balance ?? order.total_price)}</span>
              </div>
            </div>
          </section>

          {(order.payments ?? []).length > 0 && (
            <section className="mb-8">
              <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Pagamentos</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2">Data</th>
                    <th className="py-2">Forma</th>
                    <th className="py-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.payments ?? []).map((payment) => (
                    <tr key={payment.id} className="border-b border-border/50">
                      <td className="py-2">{formatDate(payment.paid_at)}</td>
                      <td className="py-2">{PAYMENT_METHOD_LABELS[payment.method]}</td>
                      <td className="py-2 text-right">{formatCurrency(payment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <footer className="mt-12 grid grid-cols-2 gap-12 print:mt-16">
            <div className="border-t border-foreground pt-2 text-center text-sm">
              Assinatura do cliente
            </div>
            <div className="border-t border-foreground pt-2 text-center text-sm">
              Responsável pela oficina
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}
