import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { IconLoader2, IconPencil, IconTrash } from "@tabler/icons-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { ProductFormDialog } from "@/components/dialogs/product-form-dialog";
import {
  getProducts,
  deleteProduct,
  type Product,
} from "@/services/product.service";
import { formatCurrency } from "@/lib/format";
import { extractApiErrorMessage } from "@/lib/errors";

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
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
      setEditing(null);
      setDialogOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setDialogOpen(true);
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

      <ProductFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editing}
        onSaved={() => void load(search)}
      />

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
