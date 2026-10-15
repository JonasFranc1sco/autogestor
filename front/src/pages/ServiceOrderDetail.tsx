import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconLoader2,
  IconPlus,
  IconTrash,
  IconPencil,
  IconDeviceFloppy,
  IconPrinter,
  IconCash,
  IconPaperclip,
  IconUpload,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/layout/Dialog";
import { FormField, FormSelect, FormTextarea } from "@/components/ui/form";
import {
  getServiceOrder,
  updateServiceOrder,
  changeServiceOrderStatus,
  registerServiceOrderPayment,
  refundServiceOrderPayment,
  getServiceOrderAttachments,
  uploadServiceOrderAttachment,
  deleteServiceOrderAttachment,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
  PAYMENT_METHOD_LABELS,
  type ServiceOrder,
  type ServiceOrderStatus,
  type PaymentMethod,
  type ServiceOrderAttachment,
} from "@/services/serviceOrder.service";
import { getEmployees, type Employee } from "@/services/employee.service";
import { getServices, type Service } from "@/services/service.service";
import { getProducts, type Product } from "@/services/product.service";
import { formatCurrency, formatDateTime, parseDecimalValue, tryParseDecimal } from "@/lib/format";
import { extractApiErrorMessage } from "@/lib/errors";
import { statusClasses } from "@/pages/ServiceOrders";

interface ServiceItemRow {
  key: number;
  service_id: string;
  service_name: string;
  price: string;
  discount: string;
}

interface ProductItemRow {
  key: number;
  product_id: string;
  quantity: string;
  price: string;
  discount: string;
}

let rowKey = 0;

const transitionLabels: Partial<Record<ServiceOrderStatus, string>> = {
  IN_PROGRESS: "Iniciar atendimento",
  WAITING_PARTS: "Aguardar peças",
  WAITING_CLIENT: "Aguardar cliente",
  DONE: "Concluir OS",
  CANCELLED: "Cancelar OS",
};

export default function ServiceOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMechanic = user?.role === "MECHANIC";
  const canEditItems = user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "ATTENDANT";
  const canEdit = canEditItems || isMechanic;

  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [mechanicId, setMechanicId] = useState("");
  const [observations, setObservations] = useState("");
  const [serviceRows, setServiceRows] = useState<ServiceItemRow[]>([]);
  const [productRows, setProductRows] = useState<ProductItemRow[]>([]);
  const [odometer, setOdometer] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [attachments, setAttachments] = useState<ServiceOrderAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getServiceOrder(id);
      setOrder(data);
      setMechanicId(data.mechanic?.id ?? "");
      setObservations(data.observations ?? "");
      setOdometer(data.odometer != null ? String(data.odometer) : "");
      setServiceRows(
        (data.services ?? []).map((item) => ({
          key: ++rowKey,
          service_id: item.service?.id ?? "",
          service_name: "",
          price: String(item.price),
          discount: String(item.discount ?? 0),
        })),
      );
      setProductRows(
        (data.products ?? []).map((item) => ({
          key: ++rowKey,
          product_id: item.product?.id ?? "",
          quantity: String(item.quantity),
          price: String(item.price),
          discount: String(item.discount ?? 0),
        })),
      );
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível carregar a ordem de serviço."));
      navigate("/os");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!id) return;
    getServiceOrderAttachments(id)
      .then(setAttachments)
      .catch(() => toast.error("Não foi possível carregar os anexos."));
  }, [id]);

  useEffect(() => {
    void Promise.all([getEmployees(), getServices(), getProducts()])
      .then(([employeeList, serviceList, productList]) => {
        setEmployees(employeeList);
        setServices(serviceList);
        setProducts(productList);
      })
      .catch(() => toast.error("Não foi possível carregar os dados de apoio."));
  }, []);

  const servicesTotal = serviceRows.reduce(
    (sum, row) => sum + (parseDecimalValue(row.price) - parseDecimalValue(row.discount)),
    0,
  );
  const productsTotal = productRows.reduce(
    (sum, row) => sum + (parseDecimalValue(row.price) * (Number(row.quantity) || 1) - parseDecimalValue(row.discount)),
    0,
  );

  async function handleStatusChange(status: ServiceOrderStatus) {
    if (!order) return;
    setSaving(true);
    try {
      const updated = await changeServiceOrderStatus(order.id, status);
      setOrder(updated);
      toast.success(`Status atualizado para "${STATUS_LABELS[status]}".`);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível alterar o status."));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdits() {
    if (!order) return;

    if (canEditItems) {
      const invalidService = serviceRows.some(
        (row) => !row.service_id && !row.service_name.trim(),
      );
      const invalidProduct = productRows.some((row) => !row.product_id);
      if (invalidService || invalidProduct) {
        toast.error("Preencha o serviço e o produto em todas as linhas antes de salvar.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = canEditItems
        ? {
            mechanic_id: mechanicId || null,
            observations,
            odometer: odometer.trim() ? Number(odometer) : null,
            services: serviceRows.map((row) => ({
              service_id: row.service_id || null,
              service_name: row.service_id ? undefined : row.service_name.trim() || undefined,
              price: parseDecimalValue(row.price).toFixed(2),
              discount: parseDecimalValue(row.discount).toFixed(2),
            })),
            products: productRows.map((row) => ({
              product_id: row.product_id,
              quantity: Number(row.quantity) || 1,
              price: parseDecimalValue(row.price).toFixed(2),
              discount: parseDecimalValue(row.discount).toFixed(2),
            })),
          }
        : { mechanic_id: mechanicId || null, observations };

      const updated = await updateServiceOrder(order.id, payload);
      setOrder(updated);
      setEditing(false);
      toast.success("Ordem de serviço atualizada.");
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível salvar as alterações."));
    } finally {
      setSaving(false);
    }
  }

  async function handleRegisterPayment() {
    if (!order) return;
    const amount = tryParseDecimal(paymentAmount);
    if (amount === null || Number.parseFloat(amount) <= 0) {
      toast.error("Informe um valor de pagamento válido.");
      return;
    }

    setSavingPayment(true);
    try {
      await registerServiceOrderPayment(order.id, {
        method: paymentMethod,
        amount,
      });
      toast.success("Pagamento registrado com sucesso.");
      setPaymentDialogOpen(false);
      setPaymentAmount("");
      await load();
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível registrar o pagamento."));
    } finally {
      setSavingPayment(false);
    }
  }

  async function handleUpload(file: File | undefined) {
    if (!order || !file) return;
    setUploading(true);
    try {
      await uploadServiceOrderAttachment(order.id, file);
      toast.success("Anexo enviado com sucesso.");
      setAttachments(await getServiceOrderAttachments(order.id));
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível enviar o anexo."));
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    if (!order) return;
    try {
      await deleteServiceOrderAttachment(order.id, attachmentId);
      setAttachments((items) => items.filter((item) => item.id !== attachmentId));
      toast.success("Anexo removido.");
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível remover o anexo."));
    }
  }

  async function handleRefund(paymentId: string) {
    if (!order) return;
    try {
      await refundServiceOrderPayment(order.id, paymentId);
      toast.success("Pagamento estornado.");
      await load();
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível estornar o pagamento."));
    }
  }

  if (loading || !order) {
    return (
      <main className="flex-1 p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconLoader2 size={18} className="animate-spin" /> Carregando ordem de serviço...
        </div>
      </main>
    );
  }

  const transitions = STATUS_TRANSITIONS[order.status] ?? [];

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/os")}
            aria-label="Voltar para ordens de serviço"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold">OS #{order.number}</h1>
            <p className="text-sm text-muted-foreground">
              Aberta em {formatDateTime(order.opened_at ?? order.created_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1.5 text-sm font-medium ${statusClasses[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>

          <Link
            to={`/os/${order.id}/imprimir`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <IconPrinter size={16} /> Imprimir
          </Link>

          {!editing && canEdit && order.status !== "DONE" && order.status !== "CANCELLED" && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <IconPencil size={16} /> Editar
            </Button>
          )}
        </div>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Cliente</h2>
          <p className="font-medium">{order.client.name}</p>
          <p className="text-sm text-muted-foreground">{order.client.document ?? "Sem documento"}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Veículo</h2>
          <p className="font-medium">
            {order.vehicle.brand} {order.vehicle.model}
          </p>
          <p className="text-sm text-muted-foreground">
            {order.vehicle.license_plate ?? "Sem placa"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Mecânico responsável</h2>
          {editing && canEditItems && (
            <div className="mb-2">
              <FormField
                label="Quilometragem (km)"
                type="number"
                min={0}
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="Ex.: 120000"
              />
            </div>
          )}
          {!editing && order.odometer != null && (
            <p className="mb-1 text-sm text-muted-foreground">{order.odometer} km</p>
          )}
          {editing ? (
            <FormSelect
              label=""
              value={mechanicId}
              onChange={(e) => setMechanicId(e.target.value)}
            >
              <option value="">Nenhum</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </FormSelect>
          ) : (
            <>
              <p className="font-medium">{order.mechanic?.name ?? "Não atribuído"}</p>
              {order.closed_at && (
                <p className="text-sm text-muted-foreground">
                  Encerrada em {formatDateTime(order.closed_at)}
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Serviços</h2>
          {editing && canEditItems && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setServiceRows((rows) => [
                  ...rows,
                  { key: ++rowKey, service_id: "", service_name: "", price: "", discount: "" },
                ])
              }
            >
              <IconPlus size={14} /> Adicionar
            </Button>
          )}
        </div>

        {(editing && canEditItems ? serviceRows.length : (order.services ?? []).length) === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum serviço registrado.</p>
        ) : editing && canEditItems ? (
          <div className="space-y-3">
            {serviceRows.map((row) => (
              <div key={row.key} className="grid grid-cols-1 gap-2 rounded-lg border border-border/50 p-3 sm:grid-cols-12">
                <div className="sm:col-span-4">
                  <FormSelect
                    label="Catálogo"
                    value={row.service_id}
                    onChange={(e) => {
                      const service = services.find((item) => item.id === e.target.value);
                      setServiceRows((rows) =>
                        rows.map((item) =>
                          item.key === row.key
                            ? {
                                ...item,
                                service_id: e.target.value,
                                service_name: "",
                                price: service ? service.sale_price : item.price,
                              }
                            : item,
                        ),
                      );
                    }}
                  >
                    <option value="">Serviço livre...</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </FormSelect>
                </div>
                {!row.service_id && (
                  <div className="sm:col-span-4">
                    <FormField
                      label="Nome do serviço"
                      value={row.service_name}
                      onChange={(e) =>
                        setServiceRows((rows) =>
                          rows.map((item) =>
                            item.key === row.key ? { ...item, service_name: e.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <FormField
                    label="Preço (R$)"
                    value={row.price}
                    inputMode="decimal"
                    onChange={(e) =>
                      setServiceRows((rows) =>
                        rows.map((item) =>
                          item.key === row.key ? { ...item, price: e.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <FormField
                    label="Desconto (R$)"
                    value={row.discount}
                    inputMode="decimal"
                    onChange={(e) =>
                      setServiceRows((rows) =>
                        rows.map((item) =>
                          item.key === row.key ? { ...item, discount: e.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
                <div className="flex items-end sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => setServiceRows((rows) => rows.filter((item) => item.key !== row.key))}
                    aria-label="Remover serviço"
                    className="mb-1 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                <tr key={item.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2">{item.service?.name ?? "Serviço"}</td>
                  <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                  <td className="py-2 text-right">{formatCurrency(item.discount ?? 0)}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(item.total_price ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Peças</h2>
          {editing && canEditItems && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setProductRows((rows) => [
                  ...rows,
                  { key: ++rowKey, product_id: "", quantity: "1", price: "", discount: "" },
                ])
              }
            >
              <IconPlus size={14} /> Adicionar
            </Button>
          )}
        </div>

        {(editing && canEditItems ? productRows.length : (order.products ?? []).length) === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma peça registrada.</p>
        ) : editing && canEditItems ? (
          <div className="space-y-3">
            {productRows.map((row) => (
              <div key={row.key} className="grid grid-cols-1 gap-2 rounded-lg border border-border/50 p-3 sm:grid-cols-12">
                <div className="sm:col-span-4">
                  <FormSelect
                    label="Produto"
                    value={row.product_id}
                    onChange={(e) => {
                      const product = products.find((item) => item.id === e.target.value);
                      setProductRows((rows) =>
                        rows.map((item) =>
                          item.key === row.key
                            ? { ...item, product_id: e.target.value, price: product ? product.sale_price : item.price }
                            : item,
                        ),
                      );
                    }}
                  >
                    <option value="">Selecione...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (est. {product.stock_quantity})
                      </option>
                    ))}
                  </FormSelect>
                </div>
                <div className="sm:col-span-2">
                  <FormField
                    label="Qtd."
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) =>
                      setProductRows((rows) =>
                        rows.map((item) =>
                          item.key === row.key ? { ...item, quantity: e.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <FormField
                    label="Preço (R$)"
                    value={row.price}
                    inputMode="decimal"
                    onChange={(e) =>
                      setProductRows((rows) =>
                        rows.map((item) =>
                          item.key === row.key ? { ...item, price: e.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <FormField
                    label="Desconto (R$)"
                    value={row.discount}
                    inputMode="decimal"
                    onChange={(e) =>
                      setProductRows((rows) =>
                        rows.map((item) =>
                          item.key === row.key ? { ...item, discount: e.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
                <div className="flex items-end sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => setProductRows((rows) => rows.filter((item) => item.key !== row.key))}
                    aria-label="Remover peça"
                    className="mb-1 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2">Produto</th>
                <th className="py-2 text-right">Qtd.</th>
                <th className="py-2 text-right">Preço</th>
                <th className="py-2 text-right">Desconto</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.products ?? []).map((item) => (
                <tr key={item.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2">{item.product?.name ?? "Produto"}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                  <td className="py-2 text-right">{formatCurrency(item.discount ?? 0)}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(item.total_price ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-2 font-semibold">Observações internas</h2>
          {editing ? (
            <FormTextarea
              label=""
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações internas"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {order.observations || "Sem observações."}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-3 font-semibold">Resumo financeiro</h2>
          {editing && canEditItems ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Serviços</span>
                <span>{formatCurrency(servicesTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Peças</span>
                <span>{formatCurrency(productsTotal)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Descrição</span>
                <span>{order.description || "—"}</span>
              </div>
            </>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span>{formatCurrency(editing && canEditItems ? servicesTotal + productsTotal : order.total_price)}</span>
          </div>
        </div>
      </section>


      <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <IconCash size={18} /> Pagamentos
          </h2>
          {order.status !== "CANCELLED" && (
            <Button type="button" variant="outline" size="sm" onClick={() => setPaymentDialogOpen(true)}>
              Registrar pagamento
            </Button>
          )}
        </div>

        {(order.payments ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2">Data</th>
                <th className="py-2">Forma</th>
                <th className="py-2">Registrado por</th>
                <th className="py-2 text-right">Valor</th>
                <th className="py-2 print:hidden" />
              </tr>
            </thead>
            <tbody>
              {(order.payments ?? []).map((payment) => (
                <tr key={payment.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2">{formatDateTime(payment.paid_at)}</td>
                  <td className="py-2">{PAYMENT_METHOD_LABELS[payment.method]}</td>
                  <td className="py-2 text-muted-foreground">{payment.created_by_name ?? "—"}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(payment.amount)}</td>
                  <td className="py-2 text-right print:hidden">
                    {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
                      <button
                        type="button"
                        onClick={() => void handleRefund(payment.id)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Estornar pagamento"
                        title="Estornar"
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-muted-foreground">Total da OS</p>
            <p className="font-semibold">{formatCurrency(order.total_price)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pago</p>
            <p className="font-semibold">{formatCurrency(order.paid_total ?? 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Saldo</p>
            <p className="font-semibold">{formatCurrency(order.balance ?? order.total_price)}</p>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <IconPaperclip size={18} /> Anexos
          </h2>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
            <IconUpload size={16} />
            {uploading ? "Enviando..." : "Enviar anexo"}
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              disabled={uploading}
              onChange={(e) => {
                void handleUpload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum anexo enviado.</p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((attachment) => (
              <li key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <a
                    href={attachment.file_url ?? attachment.file}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {attachment.description ?? "Anexo"}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(attachment.created_at)}
                    {attachment.uploaded_by_name ? ` · ${attachment.uploaded_by_name}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteAttachment(attachment.id)}
                  aria-label="Remover anexo"
                  title="Remover"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <IconTrash size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(order.events ?? []).length > 0 && (
        <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-semibold">Histórico</h2>
          <ol className="space-y-3">
            {(order.events ?? []).map((event) => (
              <li key={event.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <div>
                  <p>{event.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(event.created_at)}
                    {event.created_by_name ? ` · ${event.created_by_name}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {editing ? (
          <>
            <Button variant="outline" onClick={() => void load().then(() => setEditing(false))}>
              {isMechanic ? "Cancelar" : "Cancelar edição"}
            </Button>
            <Button onClick={() => void handleSaveEdits()} loading={saving}>
              <IconDeviceFloppy size={16} /> Salvar alterações
            </Button>
          </>
        ) : (
          transitions.map((status) => (
            <Button
              key={status}
              variant={status === "CANCELLED" ? "destructive" : "default"}
              loading={saving}
              onClick={() => {
                if (status === "CANCELLED") {
                  setCancelOpen(true);
                } else {
                  void handleStatusChange(status);
                }
              }}
            >
              {transitionLabels[status] ?? STATUS_LABELS[status]}
            </Button>
          ))
        )}
      </div>

      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        title="Registrar pagamento"
        onSubmit={() => void handleRegisterPayment()}
        submitLabel="Registrar"
        loading={savingPayment}
        maxWidth="max-w-md"
      >
        <div className="grid grid-cols-1 gap-4">
          <FormSelect
            label="Forma de pagamento"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </FormSelect>

          <FormField
            label="Valor (R$)"
            value={paymentAmount}
            inputMode="decimal"
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0,00"
          />
        </div>
      </Dialog>

      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancelar ordem de serviço"
        onSubmit={() => {
          setCancelOpen(false);
          void handleStatusChange("CANCELLED");
        }}
        submitLabel="Cancelar OS"
        loading={saving}
        destructive
        maxWidth="max-w-md"
      >
        <p className="text-sm">
          Tem certeza que deseja cancelar a <strong>OS #{order.number}</strong>? Esta ação é definitiva.
        </p>
      </Dialog>
    </main>
  );
}
