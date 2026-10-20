import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { FormField, FormSelect, FormTextarea } from "@/components/ui/form";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { ClientFormDialog } from "@/components/dialogs/client-form-dialog";
import { VehicleFormDialog } from "@/components/dialogs/vehicle-form-dialog";
import { ProductFormDialog } from "@/components/dialogs/product-form-dialog";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  getServiceOrdersPaginated,
  createServiceOrder,
  STATUS_LABELS,
  type ServiceOrder,
  type ServiceOrderStatus,
} from "@/services/serviceOrder.service";
import { getClients } from "@/services/client.service";
import { getVehicles, type Vehicle } from "@/services/vehicle.service";
import { getEmployees } from "@/services/employee.service";
import { getUsers } from "@/services/user.service";
import { getServices, type Service } from "@/services/service.service";
import { getProducts, type Product } from "@/services/product.service";
import { isInvalidPageError } from "@/services/pagination";
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
  mechanic_id: string;
  mechanic_label?: string;
  price: string;
  discount: string;
  label?: string;
}

interface ProductItemRow {
  key: number;
  product_id: string;
  seller_id: string;
  seller_label?: string;
  quantity: string;
  price: string;
  discount: string;
  label?: string;
}

let rowKey = 0;

export default function ServiceOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState("");
  const [clientLabel, setClientLabel] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleLabel, setVehicleLabel] = useState("");
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productDialogRowKey, setProductDialogRowKey] = useState<number | null>(null);
  const [newVehicle, setNewVehicle] = useState<Vehicle | null>(null);
  const productCache = useRef(new Map<string, Product>());
  const serviceCache = useRef(new Map<string, Service>());
  const [description, setDescription] = useState("");
  const [observations, setObservations] = useState("");
  const [serviceRows, setServiceRows] = useState<ServiceItemRow[]>([]);
  const [productRows, setProductRows] = useState<ProductItemRow[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const requestIdRef = useRef(0);

  const load = useCallback(async (targetPage: number, query?: string, status?: string) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await getServiceOrdersPaginated({ page: targetPage, search: query, status });
      if (requestId !== requestIdRef.current) return;
      setOrders(data.results);
      setTotalCount(data.count);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      if (targetPage > 1 && isInvalidPageError(error)) {
        setPage((current) => Math.max(1, current - 1));
        return;
      }
      toast.error(extractApiErrorMessage(error, "Não foi possível carregar as ordens de serviço."));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  useEffect(() => {
    void load(page, debouncedSearch, statusFilter);
  }, [page, debouncedSearch, statusFilter, load]);

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      openCreate();
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setClientLabel("");
    setVehicleId("");
    setVehicleLabel("");
    setNewVehicle(null);
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
      { key: ++rowKey, service_id: "", service_name: "", mechanic_id: "", price: "", discount: "" },
    ]);
  }

  function addProductRow() {
    setProductRows((rows) => [
      ...rows,
      { key: ++rowKey, product_id: "", seller_id: "", quantity: "1", price: "", discount: "" },
    ]);
  }

  function handleProductSelect(key: number, productId: string, label?: string) {
    const product = productCache.current.get(productId);
    setProductRows((rows) =>
      rows.map((row) =>
        row.key === key
          ? {
              ...row,
              product_id: productId,
              label: label ?? product?.name ?? "",
              price: product ? product.sale_price : row.price,
            }
          : row,
      ),
    );
  }

  function handleServiceSelect(key: number, serviceId: string, label?: string) {
    const service = serviceCache.current.get(serviceId);
    setServiceRows((rows) =>
      rows.map((row) =>
        row.key === key
          ? {
              ...row,
              service_id: serviceId,
              service_name: "",
              label: label ?? service?.name ?? "",
              price: service ? service.sale_price : row.price,
            }
          : row,
      ),
    );
  }

  const searchClients = useCallback(async (term: string): Promise<SearchableOption[]> => {
    const list = await getClients(term || undefined);
    return list.map((client) => ({
      id: client.id,
      primary: client.name,
      secondary: client.document ?? client.phone ?? undefined,
    }));
  }, []);

  const searchVehicles = useCallback(
    async (term: string): Promise<SearchableOption[]> => {
      if (!clientId) return [];
      const list = await getVehicles(term || undefined, clientId);
      return list.map((vehicle) => ({
        id: vehicle.id,
        primary: `${vehicle.license_plate ?? "Sem placa"} — ${vehicle.brand} ${vehicle.model}`,
        secondary: vehicle.owner.name,
      }));
    },
    [clientId],
  );

  const searchMechanics = useCallback(async (term: string): Promise<SearchableOption[]> => {
    const list = await getEmployees(term || undefined);
    return list.map((employee) => ({
      id: employee.id,
      primary: employee.name,
      secondary: employee.email ?? undefined,
    }));
  }, []);

  const searchUsers = useCallback(async (term: string): Promise<SearchableOption[]> => {
    const list = await getUsers(term || undefined);
    return list.map((user) => ({
      id: user.id,
      primary: user.full_name,
      secondary: user.email,
    }));
  }, []);

  const searchServices = useCallback(async (term: string): Promise<SearchableOption[]> => {
    const list = await getServices(term || undefined);
    for (const service of list) serviceCache.current.set(service.id, service);
    return list.map((service) => ({
      id: service.id,
      primary: service.name,
      secondary: `R$ ${service.sale_price}`,
    }));
  }, []);

  const searchProducts = useCallback(async (term: string): Promise<SearchableOption[]> => {
    const list = await getProducts(term || undefined);
    for (const product of list) productCache.current.set(product.id, product);
    return list.map((product) => ({
      id: product.id,
      primary: product.name,
      secondary: `Estoque: ${product.stock_quantity} un.`,
    }));
  }, []);

  // Auto-seleção do veículo criado pelo atalho (issue #21) — só se for do cliente atual.
  useEffect(() => {
    if (newVehicle && newVehicle.owner.id === clientId) {
      setVehicleId(newVehicle.id);
      setVehicleLabel(`${newVehicle.license_plate ?? "Sem placa"} — ${newVehicle.brand} ${newVehicle.model}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newVehicle]);

  function handleProductCreated(product: Product) {
    productCache.current.set(product.id, product);
    if (productDialogRowKey != null) {
      handleProductSelect(productDialogRowKey, product.id, product.name);
      setProductDialogRowKey(null);
    }
    setProductDialogOpen(false);
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
        description: description.trim() || undefined,
        observations: observations.trim() || undefined,
        services: serviceRows.map((row) => ({
          service_id: row.service_id || null,
          service_name: row.service_id ? undefined : row.service_name.trim(),
          mechanic_id: row.mechanic_id || null,
          price: parseDecimalValue(row.price).toFixed(2),
          discount: parseDecimalValue(row.discount).toFixed(2),
        })),
        products: productRows.map((row) => ({
          product_id: row.product_id,
          seller_id: row.seller_id || null,
          quantity: Number(row.quantity) || 1,
          price: parseDecimalValue(row.price).toFixed(2),
          discount: parseDecimalValue(row.discount).toFixed(2),
        })),
      });
      toast.success(`OS #${created.number} criada com sucesso.`);
      setDialogOpen(false);
      await load(page, debouncedSearch, statusFilter);
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
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
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
            <Pagination
              currentPage={page}
              totalCount={totalCount}
              onPageChange={setPage}
              itemLabel="ordem(ns) de serviço"
            />
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
        maxWidth="max-w-6xl"
      >
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
          <SearchableSelect
            label="Cliente"
            value={clientId || null}
            initialLabel={clientLabel || null}
            onChange={(id, option) => {
              setClientId(id ?? "");
              setClientLabel(option?.primary ?? "");
              setVehicleId("");
              setVehicleLabel("");
            }}
            searchOptions={searchClients}
            placeholder="Digite o nome, CPF ou telefone..."
            error={fieldErrors.client ?? fieldErrors.client_id}
            createLabel="Novo cliente"
            onCreate={() => setClientDialogOpen(true)}
          />

          <SearchableSelect
            label="Veículo"
            value={vehicleId || null}
            initialLabel={vehicleLabel || null}
            onChange={(id, option) => {
              setVehicleId(id ?? "");
              setVehicleLabel(option?.primary ?? "");
            }}
            searchOptions={searchVehicles}
            placeholder={clientId ? "Digite a placa, marca ou modelo..." : "Selecione o cliente primeiro"}
            error={fieldErrors.vehicle ?? fieldErrors.vehicle_id}
            disabled={!clientId}
            createLabel="Novo veículo"
            onCreate={() => setVehicleDialogOpen(true)}
          />

          <div className="sm:col-span-2">
            <FormField
              label="Descrição"
              optional
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do serviço solicitado"
              className="h-10 [&_input]:h-full"
            />
          </div>
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
                <div
                  key={row.key}
                  className={`grid grid-cols-1 items-end gap-3 rounded-lg border border-border/50 p-3 ${
                    row.service_id
                      ? "sm:grid-cols-[2fr_2fr_130px_130px_auto]"
                      : "sm:grid-cols-[1.5fr_1.5fr_1.5fr_120px_120px_auto]"
                  }`}
                >
                  <div className="min-w-0">
                    <SearchableSelect
                      label="Catálogo"
                      optional
                      value={row.service_id || null}
                      initialLabel={row.label ?? null}
                      onChange={(id, option) => handleServiceSelect(row.key, id ?? "", option?.primary)}
                      searchOptions={searchServices}
                      placeholder="Serviço livre ou busque no catálogo..."
                    />
                  </div>
                  {!row.service_id && (
                    <div className="min-w-0">
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
                        className="h-10 [&_input]:h-full"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <SearchableSelect
                      label="Mecânico"
                      optional
                      value={row.mechanic_id || null}
                      initialLabel={row.mechanic_label ?? null}
                      onChange={(id, option) =>
                        setServiceRows((rows) =>
                          rows.map((item) =>
                            item.key === row.key
                              ? { ...item, mechanic_id: id ?? "", mechanic_label: option?.primary ?? "" }
                              : item,
                          ),
                        )
                      }
                      searchOptions={searchMechanics}
                      placeholder="Selecione o mecânico..."
                    />
                  </div>
                  <div className="min-w-0">
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
                      className="h-10 [&_input]:h-full"
                    />
                  </div>
                  <div className="min-w-0">
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
                      className="h-10 [&_input]:h-full"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setServiceRows((rows) => rows.filter((item) => item.key !== row.key))}
                      aria-label="Remover serviço"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
                const product = productCache.current.get(row.product_id);
                return (
                  <div
                    key={row.key}
                    className="grid grid-cols-1 items-end gap-3 rounded-lg border border-border/50 p-3 sm:grid-cols-[2fr_2fr_90px_130px_130px_auto]"
                  >
                    <div className="min-w-0">
                      <SearchableSelect
                        label="Produto"
                        value={row.product_id || null}
                        initialLabel={row.label ?? null}
                        onChange={(id, option) => handleProductSelect(row.key, id ?? "", option?.primary)}
                        searchOptions={searchProducts}
                        placeholder="Digite o nome ou código do produto..."
                        createLabel="Novo produto"
                        onCreate={() => {
                          setProductDialogRowKey(row.key);
                          setProductDialogOpen(true);
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <SearchableSelect
                        label="Vendedor"
                        optional
                        value={row.seller_id || null}
                        initialLabel={row.seller_label ?? null}
                        onChange={(id, option) =>
                          setProductRows((rows) =>
                            rows.map((item) =>
                              item.key === row.key
                                ? { ...item, seller_id: id ?? "", seller_label: option?.primary ?? "" }
                                : item,
                            ),
                          )
                        }
                        searchOptions={searchUsers}
                        placeholder="Selecione o vendedor..."
                      />
                    </div>
                    <div className="min-w-0">
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
                        className="h-10 [&_input]:h-full"
                      />
                    </div>
                    <div className="min-w-0">
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
                        className="h-10 [&_input]:h-full"
                      />
                    </div>
                    <div className="min-w-0">
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
                        className="h-10 [&_input]:h-full"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => setProductRows((rows) => rows.filter((item) => item.key !== row.key))}
                        aria-label="Remover peça"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                    {product && (
                      <p className="text-xs text-muted-foreground sm:col-span-full">
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

      <ClientFormDialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        onSaved={(client) => {
          if (client) {
            setClientId(client.id);
            setClientLabel(client.name);
            setVehicleId("");
            setVehicleLabel("");
          }
        }}
      />

      <VehicleFormDialog
        open={vehicleDialogOpen}
        onClose={() => setVehicleDialogOpen(false)}
        defaultValues={
          clientId ? { owner_id: clientId, owner_label: clientLabel } : undefined
        }
        onSaved={(vehicle) => setNewVehicle(vehicle ?? null)}
      />

      <ProductFormDialog
        open={productDialogOpen}
        onClose={() => {
          setProductDialogOpen(false);
          setProductDialogRowKey(null);
        }}
        onSaved={(product) => product && handleProductCreated(product)}
      />
    </PageLayout>
  );
}
