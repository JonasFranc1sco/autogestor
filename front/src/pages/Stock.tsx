import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconArrowDown, IconArrowUp, IconAdjustments } from "@tabler/icons-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { FormField, FormSelect, FormTextarea } from "@/components/ui/form";
import {
  getStockMovements,
  createStockMovement,
  MOVEMENT_TYPE_LABELS,
  type StockMovement,
  type MovementType,
} from "@/services/stock.service";
import { getProducts, type Product } from "@/services/product.service";
import { formatDateTime } from "@/lib/format";
import { extractApiErrorMessage, extractFieldErrors } from "@/lib/errors";

const movementIcon: Record<MovementType, typeof IconArrowUp> = {
  IN: IconArrowUp,
  OUT: IconArrowDown,
  ADJUST: IconAdjustments,
};

const movementClasses: Record<MovementType, string> = {
  IN: "bg-status-done/10 text-status-done",
  OUT: "bg-status-cancelled/10 text-status-cancelled",
  ADJUST: "bg-status-waiting/10 text-status-waiting",
};

interface FormValues {
  product_id: string;
  movement_type: MovementType;
  quantity: string;
  reason: string;
}

const emptyForm: FormValues = {
  product_id: "",
  movement_type: "IN",
  quantity: "",
  reason: "",
};

export default function StockPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [movementList, productList] = await Promise.all([
        getStockMovements(productFilter ? { product: productFilter } : undefined),
        getProducts(),
      ]);
      setMovements(movementList);
      setProducts(productList);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível carregar o estoque."));
    } finally {
      setLoading(false);
    }
  }, [productFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = movements.filter((movement) =>
    search
      ? movement.product_name.toLowerCase().includes(search.toLowerCase()) ||
        movement.reason.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const lowStock = products.filter(
    (product) => product.min_stock_quantity != null && product.stock_quantity <= product.min_stock_quantity,
  );

  function openCreate() {
    setForm(emptyForm);
    setFieldErrors({});
    setDialogOpen(true);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.product_id) errors.product_id = "Selecione o produto.";
    const quantity = Number(form.quantity);
    if (!form.quantity.trim() || Number.isNaN(quantity) || quantity === 0) {
      errors.quantity = "Informe uma quantidade diferente de zero.";
    } else if (!Number.isInteger(quantity)) {
      errors.quantity = "A quantidade deve ser um número inteiro.";
    }
    if (form.movement_type === "IN" && quantity < 0) {
      errors.quantity = "Entradas devem ter quantidade positiva.";
    }
    if (form.movement_type === "OUT" && quantity > 0) {
      errors.quantity = "Saídas devem ter quantidade negativa.";
    }
    if (!form.reason.trim()) errors.reason = "Informe o motivo da movimentação.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSaving(true);
    try {
      await createStockMovement({
        product: form.product_id,
        movement_type: form.movement_type,
        quantity: Number(form.quantity),
        reason: form.reason.trim(),
      });
      toast.success("Movimentação registrada com sucesso.");
      setDialogOpen(false);
      await load();
    } catch (error) {
      setFieldErrors(extractFieldErrors(error));
      toast.error(extractApiErrorMessage(error, "Não foi possível registrar a movimentação."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageLayout
      title="Estoque"
      searchPlaceholder="Buscar por produto ou motivo..."
      searchValue={search}
      onSearchChange={setSearch}
      onAdd={openCreate}
      addLabel="Nova Movimentação"
    >
      {lowStock.length > 0 && (
        <div className="mb-4 rounded-lg bg-status-waiting/10 px-4 py-3">
          <p className="text-sm font-medium text-status-waiting">
            {lowStock.length} produto(s) no limite do estoque mínimo:
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {lowStock.map((product) => `${product.name} (${product.stock_quantity})`).join(", ")}
          </p>
        </div>
      )}

      <div className="mb-4 max-w-sm">
        <FormSelect
          label="Filtrar por produto"
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
        >
          <option value="">Todos os produtos</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </FormSelect>
      </div>

      <div className="rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <IconLoader2 size={18} className="animate-spin" /> Carregando movimentações...
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma movimentação de estoque registrada.
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Qtd.</th>
                  <th className="px-4 py-3 text-right">Saldo após</th>
                  <th className="px-4 py-3 max-md:hidden">Motivo</th>
                  <th className="px-4 py-3 max-lg:hidden">Quando</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((movement) => {
                  const Icon = movementIcon[movement.movement_type];
                  return (
                    <tr key={movement.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3 font-medium">{movement.product_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${movementClasses[movement.movement_type]}`}>
                          <Icon size={12} />
                          {MOVEMENT_TYPE_LABELS[movement.movement_type]}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${movement.quantity > 0 ? "text-status-done" : "text-status-cancelled"}`}>
                        {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                      </td>
                      <td className="px-4 py-3 text-right">{movement.stock_after}</td>
                      <td className="px-4 py-3 text-muted-foreground max-md:hidden">{movement.reason}</td>
                      <td className="px-4 py-3 text-muted-foreground max-lg:hidden">
                        {formatDateTime(movement.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {filtered.length} movimentação(ões) exibida(s)
            </p>
          </>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Nova Movimentação de Estoque"
        onSubmit={() => void handleSubmit()}
        submitLabel="Registrar"
        loading={saving}
        maxWidth="max-w-lg"
      >
        <div className="grid grid-cols-1 gap-4">
          <FormSelect
            label="Produto"
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            error={fieldErrors.product_id}
          >
            <option value="">Selecione o produto...</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} (saldo: {product.stock_quantity})
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Tipo de movimentação"
            value={form.movement_type}
            onChange={(e) => setForm({ ...form, movement_type: e.target.value as MovementType })}
            error={fieldErrors.movement_type}
          >
            <option value="IN">Entrada (ex.: compra)</option>
            <option value="OUT">Saída (ex.: perda) — use quantidade negativa</option>
            <option value="ADJUST">Ajuste (positivo ou negativo)</option>
          </FormSelect>

          <FormField
            label="Quantidade"
            type="number"
            step={1}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder={form.movement_type === "IN" ? "10" : "-3"}
            error={fieldErrors.quantity}
          />

          <FormTextarea
            label="Motivo"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Ex.: Compra NF 123, inventário, perda..."
            error={fieldErrors.reason}
          />
        </div>
      </Dialog>
    </PageLayout>
  );
}
