import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { IconLoader2, IconPencil, IconTrash } from "@tabler/icons-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { FormField, FormTextarea } from "@/components/ui/form";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
} from "@/services/product.service";
import { formatCurrency, tryParseDecimal } from "@/lib/format";
import { extractApiErrorMessage, extractFieldErrors } from "@/lib/errors";

interface FormValues {
  name: string;
  reference_code: string;
  barcode: string;
  description: string;
  application: string;
  supplier: string;
  brand: string;
  cost_price: string;
  margin_percentage: string;
  sale_price: string;
  stock_quantity: string;
  min_stock_quantity: string;
  location: string;
}

const emptyForm: FormValues = {
  name: "",
  reference_code: "",
  barcode: "",
  description: "",
  application: "",
  supplier: "",
  brand: "",
  cost_price: "",
  margin_percentage: "0",
  sale_price: "",
  stock_quantity: "0",
  min_stock_quantity: "5",
  location: "",
};

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      setProducts(await getProducts(query));
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível carregar os produtos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => void load(search), 300);
    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, [search, load]);

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      openCreate();
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      reference_code: product.reference_code ?? "",
      barcode: product.barcode ?? "",
      description: product.description ?? "",
      application: product.application ?? "",
      supplier: product.supplier ?? "",
      brand: product.brand ?? "",
      cost_price: product.cost_price ?? "",
      margin_percentage: product.margin_percentage ?? "0",
      sale_price: product.sale_price,
      stock_quantity: String(product.stock_quantity),
      min_stock_quantity: product.min_stock_quantity != null ? String(product.min_stock_quantity) : "",
      location: product.location ?? "",
    });
    setFieldErrors({});
    setDialogOpen(true);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Informe o nome do produto.";
    if (!editingId && tryParseDecimal(form.cost_price) === null) {
      errors.cost_price = "Informe o preço de custo.";
    }
    if (tryParseDecimal(form.sale_price) === null) errors.sale_price = "Informe o preço de venda.";
    if (Number(form.stock_quantity) < 0 || Number.isNaN(Number(form.stock_quantity))) {
      errors.stock_quantity = "Informe uma quantidade válida (≥ 0).";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSaving(true);
    const parsedCost = tryParseDecimal(form.cost_price);
    const parsedMargin = tryParseDecimal(form.margin_percentage);
    const basePayload = {
      name: form.name.trim(),
      reference_code: form.reference_code.trim() || null,
      barcode: form.barcode.trim() || null,
      description: form.description.trim() || null,
      application: form.application.trim() || null,
      supplier: form.supplier.trim() || null,
      brand: form.brand.trim() || null,
      sale_price: tryParseDecimal(form.sale_price) ?? "0.00",
      stock_quantity: Number(form.stock_quantity) || 0,
      min_stock_quantity: form.min_stock_quantity ? Number(form.min_stock_quantity) : null,
      location: form.location.trim() || null,
    };

    try {
      if (editingId) {
        await updateProduct(editingId, {
          ...basePayload,
          ...(parsedCost !== null ? { cost_price: parsedCost } : {}),
          ...(parsedMargin !== null ? { margin_percentage: parsedMargin } : {}),
        });
        toast.success("Produto atualizado com sucesso.");
      } else {
        await createProduct({
          ...basePayload,
          cost_price: parsedCost ?? "0.00",
          margin_percentage: parsedMargin ?? "0.00",
        });
        toast.success("Produto cadastrado com sucesso.");
      }
      setDialogOpen(false);
      await load(search);
    } catch (error) {
      setFieldErrors(extractFieldErrors(error));
      toast.error(extractApiErrorMessage(error, "Não foi possível salvar o produto."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      toast.success("Produto removido com sucesso.");
      setDeleteTarget(null);
      await load(search);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível remover o produto."));
    } finally {
      setDeleting(false);
    }
  }

  const lowStockCount = products.filter(
    (product) => product.min_stock_quantity != null && product.stock_quantity <= product.min_stock_quantity,
  ).length;

  return (
    <PageLayout
      title="Produtos"
      searchPlaceholder="Buscar por nome, código de barras ou referência..."
      searchValue={search}
      onSearchChange={setSearch}
      onAdd={openCreate}
      addLabel="Novo Produto"
    >
      {lowStockCount > 0 && (
        <p className="mb-4 rounded-lg bg-status-waiting/10 px-4 py-2 text-sm text-status-waiting">
          {lowStockCount} produto(s) com estoque no mínimo ou abaixo do mínimo.
        </p>
      )}

      <div className="rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <IconLoader2 size={18} className="animate-spin" /> Carregando produtos...
          </div>
        ) : products.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {search ? "Nenhum produto encontrado para esta busca." : "Nenhum produto cadastrado ainda."}
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 max-sm:hidden">Referência</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Estoque</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const lowStock =
                    product.min_stock_quantity != null && product.stock_quantity <= product.min_stock_quantity;
                  return (
                    <tr key={product.id} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02]">
                      <td className="px-4 py-3">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {product.reference_code ?? "Sem referência"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-sm:hidden">
                        {product.reference_code ?? "—"}
                      </td>
                      <td className="px-4 py-3">{formatCurrency(product.sale_price)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            lowStock ? "bg-status-waiting/10 text-status-waiting" : "bg-status-done/10 text-status-done"
                          }`}
                        >
                          {product.stock_quantity} un.
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            aria-label={`Editar ${product.name}`}
                            title="Editar"
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            <IconPencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            aria-label={`Remover ${product.name}`}
                            title="Remover"
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {products.length} produto(s) exibido(s)
            </p>
          </>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Editar Produto" : "Novo Produto"}
        onSubmit={() => void handleSubmit()}
        submitLabel={editingId ? "Salvar alterações" : "Cadastrar"}
        loading={saving}
        maxWidth="max-w-2xl"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nome do produto"
            error={fieldErrors.name}
            className="sm:col-span-2"
          />

          <FormField
            label="Código de referência"
            optional
            value={form.reference_code}
            onChange={(e) => setForm({ ...form, reference_code: e.target.value })}
            placeholder="FO-001"
            error={fieldErrors.reference_code}
          />

          <FormField
            label="Código de barras"
            optional
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            placeholder="7891234567890"
            error={fieldErrors.barcode}
          />

          <FormField
            label="Marca"
            optional
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            placeholder="Marca"
            error={fieldErrors.brand}
          />

          <FormField
            label="Fornecedor"
            optional
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            placeholder="Fornecedor"
            error={fieldErrors.supplier}
          />

          <FormField
            label="Preço de custo (R$)"
            value={form.cost_price}
            onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
            placeholder="20,00"
            inputMode="decimal"
            error={fieldErrors.cost_price}
          />

          <FormField
            label="Preço de venda (R$)"
            value={form.sale_price}
            onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
            placeholder="40,00"
            inputMode="decimal"
            error={fieldErrors.sale_price}
          />

          <FormField
            label="Estoque atual"
            type="number"
            value={form.stock_quantity}
            onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
            error={fieldErrors.stock_quantity}
          />

          <FormField
            label="Estoque mínimo"
            optional
            type="number"
            value={form.min_stock_quantity}
            onChange={(e) => setForm({ ...form, min_stock_quantity: e.target.value })}
            error={fieldErrors.min_stock_quantity}
          />

          <FormField
            label="Localização"
            optional
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Corredor A, Prateleira 3"
            error={fieldErrors.location}
            className="sm:col-span-2"
          />

          <div className="sm:col-span-2">
            <FormTextarea
              label="Descrição"
              optional
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descrição detalhada ou aplicação"
              error={fieldErrors.description}
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remover produto"
        onSubmit={() => void handleDelete()}
        submitLabel="Remover"
        loading={deleting}
        destructive
        maxWidth="max-w-md"
      >
        <p className="text-sm">
          Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>? O registro será
          ocultado e poderá ser restaurado manualmente.
        </p>
      </Dialog>
    </PageLayout>
  );
}
