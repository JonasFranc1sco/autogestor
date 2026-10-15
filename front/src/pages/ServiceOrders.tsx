import { useState, useEffect, useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getServiceOrders,
  createServiceOrder,
  type ServiceOrder,
  updateServiceOrder,
} from "@/services/serviceOrder.service";
import { getClients, type Client } from "@/services/client.service";
import { getVehicles, type Vehicle } from "@/services/vehicle.service";
import { getEmployees, type Employee } from "@/services/employee.service";
import { getProducts, type Product } from "@/services/product.service";
import {
  IconLoader2,
  IconPlus,
  IconTrash,
  IconTools,
  IconPackage,
  IconSearch,
  IconEye,
  IconAlertCircle,
} from "@tabler/icons-react";

interface FormServiceItem {
  id: string;
  service_name: string;
  price: number;
}

interface FormProductItem {
  id: string;
  product_id: string;
  product_name: string;
  reference_code?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Aberta", className: "bg-muted text-muted-foreground" },
  IN_PROGRESS: { label: "Em andamento", className: "bg-status-progress/10 text-status-progress" },
  WAITING_PARTS: { label: "Aguardando peças", className: "bg-status-waiting/10 text-status-waiting" },
  WAITING_CLIENT: { label: "Aguardando cliente", className: "bg-status-client/10 text-status-client" },
  DONE: { label: "Concluída", className: "bg-status-done/10 text-status-done" },
  CANCELLED: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
};

function formatCurrency(value: number | string | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : value || 0;
  return Number.isNaN(num)
    ? "R$ 0,00"
    : num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ServiceOrdersPage() {
  const [selectedServiceOrder, setSelectedServiceOrder] = useState<ServiceOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Main OS Form
  const [form, setForm] = useState({
    client_id: "",
    vehicle_id: "",
    mechanic_id: "",
    description: "",
    observations: "",
  });

  const [formServices, setFormServices] = useState<FormServiceItem[]>([]);
  const [formProducts, setFormProducts] = useState<FormProductItem[]>([]);

  // Sub-modal: Service Form
  const [serviceForm, setServiceForm] = useState({
    service_name: "",
    price: "",
  });
  const [serviceError, setServiceError] = useState("");

  // Sub-modal: Product Form
  const [productSearch, setProductSearch] = useState("");
  const [productForm, setProductForm] = useState({
    product_id: "",
    quantity: "1",
    price: "",
  });
  const [productError, setProductError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [oData, cData, vData, eData, pData] = await Promise.all([
        getServiceOrders(),
        getClients(),
        getVehicles(),
        getEmployees(),
        getProducts(),
      ]);
      setOrders(oData);
      setClients(cData);
      setVehicles(vData);
      setEmployees(eData);
      setProducts(pData);
    } catch (error) {
      console.error("Erro ao carregar ordens de serviço:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const term = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.client?.name?.toLowerCase().includes(term) ||
        o.vehicle?.license_plate?.toLowerCase().includes(term) ||
        o.vehicle?.model?.toLowerCase().includes(term) ||
        o.mechanic?.name?.toLowerCase().includes(term) ||
        o.status.toLowerCase().includes(term)
    );
  }, [orders, search]);

  const filteredVehicles = useMemo(() => {
    if (!form.client_id) return [];
    return vehicles.filter((v) => v.owner?.id === form.client_id);
  }, [vehicles, form.client_id]);

  const filteredProductsList = useMemo(() => {
    const term = productSearch.toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.reference_code?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term)
    );
  }, [products, productSearch]);

  const selectedProductDetail = useMemo(() => {
    return products.find((p) => p.id === productForm.product_id);
  }, [products, productForm.product_id]);

  // Calculations
  const servicesTotal = useMemo(() => {
    return formServices.reduce((acc, curr) => acc + curr.price, 0);
  }, [formServices]);

  const productsTotal = useMemo(() => {
    return formProducts.reduce((acc, curr) => acc + curr.subtotal, 0);
  }, [formProducts]);

  const grandTotal = useMemo(() => {
    return servicesTotal + productsTotal;
  }, [servicesTotal, productsTotal]);

  // Handlers for Services
  function handleAddService() {
    setServiceError("");
    if (!serviceForm.service_name.trim()) {
      setServiceError("Informe o nome do serviço prestado.");
      return;
    }
    const price = parseFloat(serviceForm.price);
    if (Number.isNaN(price) || price < 0) {
      setServiceError("Informe um valor válido cobrado pelo mecânico.");
      return;
    }

    setFormServices((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        service_name: serviceForm.service_name.trim(),
        price,
      },
    ]);

    setServiceForm({ service_name: "", price: "" });
    setServiceModalOpen(false);
  }

  function handleRemoveService(id: string) {
    setFormServices((prev) => prev.filter((item) => item.id !== id));
  }

  // Handlers for Products
  function handleSelectProduct(product: Product) {
    setProductForm({
      product_id: product.id,
      quantity: "1",
      price: product.sale_price || "0",
    });
  }

  function handleAddProduct() {
    setProductError("");
    if (!productForm.product_id) {
      setProductError("Selecione um produto da lista.");
      return;
    }

    const qty = parseInt(productForm.quantity, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      setProductError("Informe uma quantidade válida maior que zero.");
      return;
    }

    const price = parseFloat(productForm.price);
    if (Number.isNaN(price) || price < 0) {
      setProductError("Informe um preço unitário válido.");
      return;
    }

    const product = products.find((p) => p.id === productForm.product_id);
    if (!product) return;

    setFormProducts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        product_id: product.id,
        product_name: product.name,
        reference_code: product.reference_code,
        quantity: qty,
        price,
        subtotal: qty * price,
      },
    ]);

    setProductForm({ product_id: "", quantity: "1", price: "" });
    setProductSearch("");
    setProductModalOpen(false);
  }

  function handleRemoveProduct(id: string) {
    setFormProducts((prev) => prev.filter((item) => item.id !== id));
  }

  // Create OS
  async function handleSubmit() {
    setErrorMessage(null);
    if (!form.client_id) {
      setErrorMessage("Por favor, selecione um cliente.");
      return;
    }
    if (!form.vehicle_id) {
      setErrorMessage("Por favor, selecione um veículo.");
      return;
    }

    try {
      setSaving(true);

      const data = {
        ...form,
      }

      if (selectedServiceOrder){
        await updateServiceOrder(selectedServiceOrder.id, data);
      } else {
        await createServiceOrder(data);
      }

      setDialogOpen(false);
      setSelectedServiceOrder(null);
      await loadData();
    } catch (error: unknown) {
      console.error("Erro ao criar ordem de serviço:", error);
      setErrorMessage(
        "Erro ao criar ordem de serviço. Verifique todos os campos obrigatórios."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEditServiceOrder(order: ServiceOrder) {
    setSelectedServiceOrder(order);

    setForm({
      client_id: order.client.id,
      vehicle_id: order.vehicle.id,
      mechanic_id: order.mechanic?.id ?? "Não definido",
      description: order.description ?? "",
      observations: order.observations ?? "",
    });

    setDialogOpen(true);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  }

  return (
    <>
      <PageLayout
        title="Ordens de Serviço"
        searchPlaceholder="Buscar por cliente, placa, mecânico ou status..."
        searchValue={search}
        onSearchChange={setSearch}
        onAdd={() => {
          setErrorMessage(null);
          setForm({
            client_id: "",
            vehicle_id: "",
            mechanic_id: "",
            description: "",
            observations: "",
          });
          setDialogOpen(true)
        }}
        addLabel="Nova OS"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <IconLoader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <Table variant="card">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Mecânico</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                    Nenhuma ordem de serviço encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} onClick={() => handleEditServiceOrder(order)}
                  className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium">{order.client?.name || "—"}</TableCell>
                    <TableCell>
                      {order.vehicle?.license_plate} — {order.vehicle?.brand} {order.vehicle?.model}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.mechanic?.name || <span className="italic">Não atribuído</span>}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          statusConfig[order.status]?.className || ""
                        }`}
                      >
                        {statusConfig[order.status]?.label || order.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(order.total_price)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailModalOpen(true);
                        }}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Ver detalhes"
                      >
                        <IconEye size={18} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </PageLayout>

      {/* Modal Principal: Nova Ordem de Serviço */}
      <Dialog
        open={dialogOpen}
        onClose={() =>{setDialogOpen(false); setSelectedServiceOrder(null);}}
        title={selectedServiceOrder ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
        onSubmit={handleSubmit}
        submitLabel={selectedServiceOrder ? "Salvar alterações" : "Criar Ordem de Serviço"}
        loading={saving}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <IconAlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Seção 1: Dados Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Cliente *</label>
              <select
                value={form.client_id}
                onChange={(e) =>
                  setForm({ ...form, client_id: e.target.value, vehicle_id: "" })
                }
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Selecione um cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.document || "S/ Doc"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Veículo *</label>
              <select
                value={form.vehicle_id}
                onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
                disabled={!form.client_id}
              >
                <option value="">
                  {form.client_id ? "Selecione um veículo" : "Selecione um cliente primeiro"}
                </option>
                {filteredVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.license_plate} — {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>

            {/* Mecânico Dropdown */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Mecânico Responsável
              </label>
              <select
                value={form.mechanic_id}
                onChange={(e) => setForm({ ...form, mechanic_id: e.target.value })}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Selecione um mecânico (opcional)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.phone ? `(${emp.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seção 2: Serviços Prestados */}
          <div className="rounded-xl border border-border bg-surface/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconTools size={18} className="text-primary" />
                <h3 className="font-semibold text-sm">Serviços Prestados</h3>
                <span className="text-xs text-muted-foreground">({formServices.length})</span>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  setServiceError("");
                  setServiceModalOpen(true);
                }}
              >
                <IconPlus size={14} />
                Adicionar Serviço
              </Button>
            </div>

            {formServices.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2 text-center">
                Nenhum serviço adicionado. Clique no botão acima para adicionar.
              </p>
            ) : (
              <div className="space-y-2">
                {formServices.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-xs md:text-sm">{item.service_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-xs md:text-sm text-primary">
                        {formatCurrency(item.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(item.id)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        title="Remover serviço"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção 3: Produtos e Peças */}
          <div className="rounded-xl border border-border bg-surface/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconPackage size={18} className="text-primary" />
                <h3 className="font-semibold text-sm">Peças & Produtos</h3>
                <span className="text-xs text-muted-foreground">({formProducts.length})</span>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  setProductError("");
                  setProductModalOpen(true);
                }}
              >
                <IconPlus size={14} />
                Adicionar Produto
              </Button>
            </div>

            {formProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2 text-center">
                Nenhuma peça adicionada. Clique no botão acima para adicionar.
              </p>
            ) : (
              <div className="space-y-2">
                {formProducts.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-xs md:text-sm">{item.product_name}</p>
                      {item.reference_code && (
                        <p className="text-[11px] text-muted-foreground">
                          Ref: {item.reference_code}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {item.quantity}x {formatCurrency(item.price)}
                      </span>
                      <span className="font-semibold text-xs md:text-sm text-primary">
                        {formatCurrency(item.subtotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(item.id)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        title="Remover peça"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção 4: Descrição e Observações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Descrição do serviço</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descreva o serviço solicitado pelo cliente..."
                rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Observações internas</label>
              <textarea
                value={form.observations}
                onChange={(e) => setForm({ ...form, observations: e.target.value })}
                placeholder="Observações da equipe ou peças em falta..."
                rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Seção 5: Resumo Financeiro da OS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Serviços: <strong className="text-foreground">{formatCurrency(servicesTotal)}</strong></span>
              <span>Peças: <strong className="text-foreground">{formatCurrency(productsTotal)}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">Total Estimado:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Sub-modal: Escrever Serviço Prestado e Valor Cobrado pelo Mecânico */}
      <Dialog
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        title="Adicionar Serviço Prestado"
        onSubmit={handleAddService}
        submitLabel="Inserir Serviço"
        zIndex="z-[60]"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {serviceError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              <IconAlertCircle size={16} />
              <span>{serviceError}</span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Serviço Prestado *</label>
            <Input
              placeholder="Ex: Troca de pastilhas de freio dianteiras"
              value={serviceForm.service_name}
              onChange={(e) => setServiceForm({ ...serviceForm, service_name: e.target.value })}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Valor Cobrado pelo Mecânico (R$) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={serviceForm.price}
              onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Informe o valor da mão de obra correspondente a este serviço.
            </p>
          </div>
        </div>
      </Dialog>

      {/* Sub-modal: Procurar e Selecionar Produto */}
      <Dialog
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title="Procurar e Selecionar Produto"
        onSubmit={handleAddProduct}
        submitLabel="Inserir Peça"
        zIndex="z-[60]"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {productError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              <IconAlertCircle size={16} />
              <span>{productError}</span>
            </div>
          )}

          {/* Busca de Produto */}
          <div>
            <label className="mb-1 block text-sm font-medium">Buscar Peça / Produto</label>
            <div className="relative">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, marca ou código..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Lista de Seleção de Produtos */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Selecione na lista abaixo ({filteredProductsList.length} encontrados):
            </label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border bg-background">
              {filteredProductsList.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  Nenhum produto encontrado.
                </div>
              ) : (
                filteredProductsList.map((prod) => {
                  const isSelected = productForm.product_id === prod.id;
                  return (
                    <button
                      type="button"
                      key={prod.id}
                      onClick={() => handleSelectProduct(prod)}
                      className={`w-full flex items-center justify-between p-2.5 text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{prod.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {prod.brand || "Genérico"} {prod.reference_code ? `| Ref: ${prod.reference_code}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{formatCurrency(prod.sale_price)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Estoque: {prod.stock_quantity} un.
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Quantidade e Preço do Produto Selecionado */}
          {selectedProductDetail && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Quantidade *</label>
                <Input
                  type="number"
                  min="1"
                  max={selectedProductDetail.stock_quantity || 9999}
                  value={productForm.quantity}
                  onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">Preço Unitário (R$) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                />
              </div>

              <div className="col-span-2 flex justify-between items-center pt-2 text-xs border-t border-border/50">
                <span className="text-muted-foreground">Subtotal deste item:</span>
                <span className="font-bold text-sm text-primary">
                  {formatCurrency(
                    (parseInt(productForm.quantity, 10) || 0) * (parseFloat(productForm.price) || 0)
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* Modal de Visualização de Detalhes da Ordem de Serviço */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Detalhes da Ordem de Serviço #${selectedOrder?.id.slice(0, 8)}`}
        hideSubmit
        maxWidth="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-border bg-surface p-4">
              <div>
                <span className="text-xs text-muted-foreground block">Cliente</span>
                <p className="font-semibold">{selectedOrder.client?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedOrder.client?.document}</p>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Veículo</span>
                <p className="font-semibold">{selectedOrder.vehicle?.license_plate}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedOrder.vehicle?.brand} {selectedOrder.vehicle?.model}
                </p>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Mecânico</span>
                <p className="font-semibold">
                  {selectedOrder.mechanic?.name || <span className="italic">Não atribuído</span>}
                </p>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Status</span>
                <span
                  className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    statusConfig[selectedOrder.status]?.className || ""
                  }`}
                >
                  {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Criado em</span>
                <p className="font-medium text-xs mt-1">{formatDate(selectedOrder.created_at)}</p>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Valor Total</span>
                <p className="font-bold text-base text-primary">
                  {formatCurrency(selectedOrder.total_price)}
                </p>
              </div>
            </div>

            {selectedOrder.description && (
              <div>
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Descrição do Serviço
                </h4>
                <p className="rounded-lg border border-border bg-background p-3 text-xs leading-relaxed">
                  {selectedOrder.description}
                </p>
              </div>
            )}

            {selectedOrder.observations && (
              <div>
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Observações Internas
                </h4>
                <p className="rounded-lg border border-border bg-background p-3 text-xs leading-relaxed">
                  {selectedOrder.observations}
                </p>
              </div>
            )}

            {/* Serviços da OS */}
            {selectedOrder.services && selectedOrder.services.length > 0 && (
              <div>
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <IconTools size={14} className="text-primary" />
                  Serviços Realizados
                </h4>
                <div className="space-y-1.5">
                  {selectedOrder.services.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-xs"
                    >
                      <span>{item.service?.name || item.service_name || "Serviço"}</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(item.total_price || item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Produtos da OS */}
            {selectedOrder.products && selectedOrder.products.length > 0 && (
              <div>
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <IconPackage size={14} className="text-primary" />
                  Peças & Materiais Utilizados
                </h4>
                <div className="space-y-1.5">
                  {selectedOrder.products.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-xs"
                    >
                      <span>
                        {item.product?.name} ({item.quantity}x)
                      </span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(item.total_price || item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
