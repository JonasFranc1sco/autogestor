import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { FormField, FormSelect, FormTextarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  getServiceOrders,
  createServiceOrder,
  STATUS_LABELS,
  type ServiceOrder,
  type ServiceOrderStatus,
} from "@/services/serviceOrder.service";
import { getClients, type Client } from "@/services/client.service";
import { getVehicles, type Vehicle } from "@/services/vehicle.service";
import { getEmployees, type Employee } from "@/services/employee.service";
import { getServices, type Service } from "@/services/service.service";
import { getProducts, type Product } from "@/services/product.service";
import { formatCurrency, formatDate, parseDecimalValue } from "@/lib/format";
import { extractApiErrorMessage, extractFieldErrors } from "@/lib/errors";

export const statusClasses: Record<ServiceOrderStatus, string> = {
  OPEN: "bg-status-open/10 text-status-open",
  IN_PROGRESS: "bg-status-progress/10 text-status-progress",
  WAITING_PARTS: "bg-status-waiting/10 text-status-waiting",
  WAITING_CLIENT: "bg-status-client/10 text-status-client",
  DONE: "bg-status-done/10 text-status-done",
  CANCELLED: "bg-status-cancelled/10 text-status-cancelled",
};

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

export default function ServiceOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [clientId, setClientId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [mechanicId, setMechanicId] = useState("");
  const [description, setDescription] = useState("");
  const [observations, setObservations] = useState("");
  const [serviceRows, setServiceRows] = useState<ServiceItemRow[]>([]);
  const [productRows, setProductRows] = useState<ProductItemRow[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (query?: string, status?: string) => {
    setLoading(true);
    try {
      setOrders(await getServiceOrders(query, status));
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível carregar as ordens de serviço."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => void load(search, statusFilter), 300);
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, [search, statusFilter, load]);

  useEffect(() => {
    void Promise.all([getClients(), getVehicles(), getEmployees(), getServices(), getProducts()])
      .then(([clientList, vehicleList, employeeList, serviceList, productList]) => {
        setClients(clientList);
        setVehicles(vehicleList);
        setEmployees(employeeList);
        setServices(serviceList);
        setProducts(productList);
      })
      .catch(() => toast.error("Não foi possível carregar os dados de apoio."));
  }, []);

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      openCreate();
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.owner.id === clientId),
    [vehicles, clientId],
  );

  const servicesTotal = serviceRows.reduce(
    (sum, row) => sum + (parseDecimalValue(row.price) - parseDecimalValue(row.discount)),
    0,
  );
  const productsTotal = productRows.reduce(
    (sum, row) => sum + (parseDecimalValue(row.price) * (Number(row.quantity) || 1) - parseDecimalValue(row.discount)),
    0,
  );

  function openCreate() {
    setClientId("");
    setVehicleId("");
    setMechanicId("");
    setDescription("");
    setObservations("");
    setServiceRows([]);
    setProductRows([]);
    setFieldErrors({});
    setDialogOpen(true);
  }

  function addServiceRow() {
    setServiceRows((rows) => [
      ...rows,
      { key: ++rowKey, service_id: "", service_name: "", price: "", discount: "" },
    ]);
  }

  function addProductRow() {
    setProductRows((rows) => [
      ...rows,
      { key: ++rowKey, product_id: "", quantity: "1", price: "", discount: "" },
    ]);
  }

  function handleProductSelect(key: number, productId: string) {
    const product = products.find((item) => item.id === productId);
    setProductRows((rows) =>
      rows.map((row) =>
        row.key === key
          ? { ...row, product_id: productId, price: product ? product.sale_price : "" }
          : row,
      ),
    );
  }

  function handleServiceSelect(key: number, serviceId: string) {
    const service = services.find((item) => item.id === serviceId);
    setServiceRows((rows) =>
      rows.map((row) =>
        row.key === key
          ? {
              ...row,
              service_id: serviceId,
              service_name: "",
              price: service ? service.sale_price : row.price,
            }
          : row,
      ),
    );
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!clientId) errors.client = "Selecione o cliente.";
    if (!vehicleId) errors.vehicle = "Selecione o veículo.";
    for (const row of serviceRows) {
      if (!row.service_id && !row.service_name.trim()) {
        errors.services = "Informe o serviço (catálogo ou nome livre) em todas as linhas.";
      }
    }
    for (const row of productRows) {
      if (!row.product_id) {
        errors.products = "Selecione o produto em todas as linhas.";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSaving(true);
    try {
      const created = await createServiceOrder({
        client_id: clientId,
        vehicle_id: vehicleId,
        mechanic_id: mechanicId || null,
        description: description.trim() || undefined,
        observations: observations.trim() || undefined,
        services: serviceRows.map((row) => ({
          service_id: row.service_id || null,
          service_name: row.service_id ? undefined : row.service_name.trim(),
          price: parseDecimalValue(row.price).toFixed(2),
          discount: parseDecimalValue(row.discount).toFixed(2),
        })),
        products: productRows.map((row) => ({
          product_id: row.product_id,
          quantity: Number(row.quantity) || 1,
          price: parseDecimalValue(row.price).toFixed(2),
          discount: parseDecimalValue(row.discount).toFixed(2),
        })),
      });
      toast.success(`OS #${created.number} criada com sucesso.`);
      setDialogOpen(false);
      await load(search, statusFilter);
    } catch (error) {
      setFieldErrors(extractFieldErrors(error));
      toast.error(extractApiErrorMessage(error, "Não foi possível criar a ordem de serviço."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageLayout
      title="Ordens de Serviço"
      searchPlaceholder="Buscar por número, cliente ou placa..."
      searchValue={search}
      onSearchChange={setSearch}
      onAdd={openCreate}
      addLabel="Nova OS"
    >
      <div className="mb-4">
        <FormSelect
          label="Filtrar por status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_LABELS) as ServiceOrderStatus[]).map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </FormSelect>
      </div>

      <div className="rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <IconLoader2 size={18} className="animate-spin" /> Carregando ordens de serviço...
          </div>
        ) : orders.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {search || statusFilter
              ? "Nenhuma ordem de serviço encontrada para os filtros."
              : "Nenhuma ordem de serviço registrada ainda."}
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">OS</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 max-md:hidden">Veículo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 max-lg:hidden">Data</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/os/${order.id}`)}
                    className="cursor-pointer border-b border-border/50 last:border-0 hover:bg-foreground/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">#{order.number}</p>
                    </td>
                    <td className="px-4 py-3">{order.client.name}</td>
                    <td className="px-4 py-3 text-muted-foreground max-md:hidden">
                      {order.vehicle.license_plate ?? order.vehicle.model}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-lg:hidden">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {orders.length} ordem(ns) de serviço exibida(s)
            </p>
          </>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Nova Ordem de Serviço"
        onSubmit={() => void handleSubmit()}
        submitLabel="Criar OS"
        loading={saving}
        maxWidth="max-w-3xl"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            label="Cliente"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setVehicleId("");
            }}
            error={fieldErrors.client ?? fieldErrors.client_id}
          >
            <option value="">Selecione o cliente...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Veículo"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            error={fieldErrors.vehicle ?? fieldErrors.vehicle_id}
            disabled={!clientId}
          >
            <option value="">{clientId ? "Selecione o veículo..." : "Selecione o cliente primeiro"}</option>
            {clientVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.license_plate ?? "Sem placa"} — {vehicle.brand} {vehicle.model}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Mecânico responsável"
            optional
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

          <FormField
            label="Descrição"
            optional
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição do serviço solicitado"
          />
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Serviços</h3>
            <Button type="button" variant="outline" size="sm" onClick={addServiceRow}>
              <IconPlus size={14} /> Adicionar serviço
            </Button>
          </div>

          {serviceRows.length === 0 ? (
            <p className="mb-2 text-xs text-muted-foreground">Nenhum serviço adicionado.</p>
          ) : (
            <div className="space-y-3">
              {serviceRows.map((row) => (
                <div key={row.key} className="grid grid-cols-1 gap-2 rounded-lg border border-border/50 p-3 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <FormSelect
                      label="Catálogo"
                      value={row.service_id}
                      onChange={(e) => handleServiceSelect(row.key, e.target.value)}
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
                        placeholder="Ex: Troca de óleo"
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
                      placeholder="0,00"
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
                      placeholder="0,00"
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
          )}
          {fieldErrors.services && <p className="mt-1 text-xs text-destructive">{fieldErrors.services}</p>}
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Peças</h3>
            <Button type="button" variant="outline" size="sm" onClick={addProductRow}>
              <IconPlus size={14} /> Adicionar peça
            </Button>
          </div>

          {productRows.length === 0 ? (
            <p className="mb-2 text-xs text-muted-foreground">Nenhuma peça adicionada.</p>
          ) : (
            <div className="space-y-3">
              {productRows.map((row) => {
                const product = products.find((item) => item.id === row.product_id);
                return (
                  <div key={row.key} className="grid grid-cols-1 gap-2 rounded-lg border border-border/50 p-3 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <FormSelect
                        label="Produto"
                        value={row.product_id}
                        onChange={(e) => handleProductSelect(row.key, e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {products.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} (est. {item.stock_quantity})
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
                        placeholder="0,00"
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
                        placeholder="0,00"
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
                    {product && (
                      <p className="text-xs text-muted-foreground sm:col-span-12">
                        Estoque atual: {product.stock_quantity} un.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {fieldErrors.products && <p className="mt-1 text-xs text-destructive">{fieldErrors.products}</p>}
        </div>

        <div className="mt-6">
          <FormTextarea
            label="Observações internas"
            optional
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Observações internas sobre o serviço"
          />
        </div>

        <div className="mt-6 rounded-lg bg-foreground/5 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Serviços</span>
            <span>{formatCurrency(servicesTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Peças</span>
            <span>{formatCurrency(productsTotal)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span>{formatCurrency(servicesTotal + productsTotal)}</span>
          </div>
        </div>
      </Dialog>
    </PageLayout>
  );
}
