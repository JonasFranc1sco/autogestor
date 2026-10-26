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
import { getWorkshop, type Workshop } from "@/services/workshop.service";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/format";
import { maskCep, maskCpfCnpj, maskPhone, toLocalPhoneDigits } from "@/lib/masks";
import { extractApiErrorMessage } from "@/lib/errors";

interface PrintableAddress {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string | null;
}

function formatFullAddress(address?: PrintableAddress | null): string | null {
  if (!address) return null;
  const streetPart = [
    address.street,
    address.number ? `nº ${address.number}` : null,
    address.complement || null,
  ]
    .filter(Boolean)
    .join(", ");
  const cityPart = [
    address.neighborhood,
    address.city && address.state ? `${address.city}/${address.state}` : address.city || address.state,
    address.cep ? `CEP ${maskCep(address.cep)}` : null,
  ]
    .filter(Boolean)
    .join(" — ");
  return [streetPart, cityPart].filter(Boolean).join(" · ") || null;
}

function formatFormattedPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = toLocalPhoneDigits(phone);
  return digits ? maskPhone(digits) : phone;
}

function ItemTableColGroup() {
  return (
    <colgroup>
      <col className="w-[34%]" />
      <col className="w-[20%]" />
      <col className="w-[8%]" />
      <col className="w-[13%]" />
      <col className="w-[12%]" />
      <col className="w-[13%]" />
    </colgroup>
  );
}

export default function ServiceOrderPrintPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getServiceOrder(id),
      getWorkshop().catch(() => null),
    ])
      .then(([orderData, workshopData]) => {
        setOrder(orderData);
        setWorkshop(workshopData);
      })
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

  const workshopData = workshop ?? user?.workshop ?? null;
  const workshopAddress = formatFullAddress(workshopData?.address);
  const workshopPhone = formatFormattedPhone(workshopData?.phone);
  const clientAddress = formatFullAddress(order.client.address);
  const clientPhone = formatFormattedPhone(order.client.phone);
  const vehicleMileage =
    order.odometer != null
      ? `${order.odometer} km`
      : order.vehicle.mileage
        ? `${order.vehicle.mileage} km`
        : "Não informada";

  const servicesSubtotal = (order.services ?? []).reduce(
    (sum, item) => sum + Number(item.total_price ?? 0),
    0,
  );
  const productsSubtotal = (order.products ?? []).reduce(
    (sum, item) => sum + Number(item.total_price ?? 0),
    0,
  );

  return (
    <main className="min-h-screen bg-background p-6 print:p-0">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <Button variant="outline" onClick={() => navigate(`/os/${order.id}`)}>
            <IconArrowLeft size={16} /> Voltar
          </Button>
          <Button onClick={() => window.print()}>
            <IconPrinter size={16} /> Imprimir
          </Button>
        </div>

        <article className="flex min-h-[calc(100vh-6rem)] flex-col justify-between rounded-2xl border border-border bg-surface p-8 print:min-h-screen print:rounded-none print:border-0 print:bg-white print:text-black">
          <div>
            {/* HEADER */}
            <header className="mb-6 flex items-start justify-between gap-6 border-b border-border pb-5">
              <div className="flex items-start gap-4">
                {workshopData?.logo_url && (
                  <img
                    src={workshopData.logo_url}
                    alt={workshopData.name}
                    className="max-h-16 max-w-28 shrink-0 object-contain"
                  />
                )}
                <div className="space-y-0.5">
                  <h1 className="text-xl font-bold leading-tight">
                    {workshopData?.name ?? "Oficina"}
                  </h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    {workshopData?.cnpj && (
                      <span>CNPJ: {maskCpfCnpj(workshopData.cnpj)}</span>
                    )}
                    {workshopPhone && <span>Tel.: {workshopPhone}</span>}
                  </div>
                  {workshopAddress && (
                    <p className="text-xs text-muted-foreground">{workshopAddress}</p>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-lg font-bold">OS #{order.number}</p>
                <p className="text-xs text-muted-foreground">
                  Aberta em {formatDateTime(order.opened_at ?? order.created_at)}
                </p>
                {order.closed_at && (
                  <p className="text-xs text-muted-foreground">
                    Encerrada em {formatDateTime(order.closed_at)}
                  </p>
                )}
                <p className="mt-1 inline-block rounded-md border border-border px-2 py-0.5 text-xs font-semibold uppercase">
                  Status: {STATUS_LABELS[order.status]}
                </p>
              </div>
            </header>

            {/* CLIENTE & VEÍCULO */}
            <section className="mb-6 grid grid-cols-2 gap-6 rounded-xl border border-border p-4">
              <div className="space-y-1 pr-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cliente
                </h2>
                <p className="font-semibold">{order.client.name}</p>
                <div className="grid grid-cols-1 gap-0.5 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">CPF/CNPJ:</span>{" "}
                    {order.client.document ? maskCpfCnpj(order.client.document) : "Não informado"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Telefone:</span>{" "}
                    {clientPhone ?? "Não informado"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Endereço:</span>{" "}
                    {clientAddress ?? "Não informado"}
                  </p>
                </div>
              </div>

              <div className="space-y-1 border-l border-border pl-6">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Veículo
                </h2>
                <p className="font-semibold">
                  {order.vehicle.brand} {order.vehicle.model}
                </p>
                <div className="grid grid-cols-1 gap-0.5 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Marca / Modelo:</span>{" "}
                    {order.vehicle.brand} / {order.vehicle.model}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Placa:</span>{" "}
                    {order.vehicle.license_plate ?? "Sem placa"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Quilometragem:</span>{" "}
                    {vehicleMileage}
                  </p>
                </div>
              </div>
            </section>

            {/* DESCRIÇÃO */}
            {order.description && (
              <section className="mb-6">
                <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Descrição do serviço
                </h2>
                <p className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                  {order.description}
                </p>
              </section>
            )}

            {/* TABELA DE SERVIÇOS (SIMÉTRICA À DE PEÇAS) */}
            <section className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Serviços
              </h2>
              <table className="w-full table-fixed text-sm">
                <ItemTableColGroup />
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-2">Serviço</th>
                    <th className="py-2 pr-2">Mecânico</th>
                    <th className="py-2 text-right">Qtd.</th>
                    <th className="py-2 text-right">Valor Unit.</th>
                    <th className="py-2 text-right">Desconto</th>
                    <th className="py-2 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.services ?? []).length === 0 ? (
                    <tr className="border-b border-border/50">
                      <td colSpan={6} className="py-3 text-center text-xs text-muted-foreground">
                        Nenhum serviço registrado.
                      </td>
                    </tr>
                  ) : (
                    (order.services ?? []).map((item) => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="truncate py-2 pr-2">{item.service?.name ?? "Serviço"}</td>
                        <td className="truncate py-2 pr-2 text-muted-foreground">
                          {item.mechanic?.name ?? "—"}
                        </td>
                        <td className="py-2 text-right">1</td>
                        <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                        <td className="py-2 text-right">{formatCurrency(item.discount ?? 0)}</td>
                        <td className="py-2 text-right font-medium">
                          {formatCurrency(item.total_price ?? 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>

            {/* TABELA DE PEÇAS (SIMÉTRICA À DE SERVIÇOS) */}
            <section className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Peças
              </h2>
              <table className="w-full table-fixed text-sm">
                <ItemTableColGroup />
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-2">Peça / Produto</th>
                    <th className="py-2 pr-2">Vendedor</th>
                    <th className="py-2 text-right">Qtd.</th>
                    <th className="py-2 text-right">Valor Unit.</th>
                    <th className="py-2 text-right">Desconto</th>
                    <th className="py-2 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.products ?? []).length === 0 ? (
                    <tr className="border-b border-border/50">
                      <td colSpan={6} className="py-3 text-center text-xs text-muted-foreground">
                        Nenhuma peça registrada.
                      </td>
                    </tr>
                  ) : (
                    (order.products ?? []).map((item) => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="truncate py-2 pr-2">{item.product?.name ?? "Produto"}</td>
                        <td className="truncate py-2 pr-2 text-muted-foreground">
                          {item.seller?.full_name ?? "—"}
                        </td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                        <td className="py-2 text-right">{formatCurrency(item.discount ?? 0)}</td>
                        <td className="py-2 text-right font-medium">
                          {formatCurrency(item.total_price ?? 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>

            {/* PAGAMENTOS & RESUMO FINANCEIRO */}
            <section className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                {(order.payments ?? []).length > 0 && (
                  <>
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Pagamentos Registrados
                    </h2>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                          <th className="py-1.5">Data</th>
                          <th className="py-1.5">Forma</th>
                          <th className="py-1.5 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(order.payments ?? []).map((payment) => (
                          <tr key={payment.id} className="border-b border-border/50">
                            <td className="py-1.5">{formatDate(payment.paid_at)}</td>
                            <td className="py-1.5">{PAYMENT_METHOD_LABELS[payment.method]}</td>
                            <td className="py-1.5 text-right">{formatCurrency(payment.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>

              <div className="ml-auto w-full max-w-xs rounded-xl border border-border p-4 text-sm">
                <div className="flex justify-between py-1 text-xs text-muted-foreground">
                  <span>Subtotal Serviços</span>
                  <span>{formatCurrency(servicesSubtotal)}</span>
                </div>
                <div className="flex justify-between py-1 text-xs text-muted-foreground">
                  <span>Subtotal Peças</span>
                  <span>{formatCurrency(productsSubtotal)}</span>
                </div>
                <div className="mt-1 flex justify-between border-t border-border pt-2 font-semibold">
                  <span>Total da OS</span>
                  <span>{formatCurrency(order.total_price)}</span>
                </div>
                <div className="flex justify-between py-1 text-xs text-muted-foreground">
                  <span>Valor Pago</span>
                  <span>{formatCurrency(order.paid_total ?? 0)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <span>Saldo</span>
                  <span>{formatCurrency(order.balance ?? order.total_price)}</span>
                </div>
              </div>
            </section>
          </div>

          {/* ASSINATURAS NO FINAL DA PÁGINA */}
          <footer className="mt-auto grid grid-cols-2 gap-12 pt-16">
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
