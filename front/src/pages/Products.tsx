import { useState, useEffect, useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { getProducts, createProduct, type Product } from "@/services/product.service";
import { IconLoader2 } from "@tabler/icons-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    reference_code: "",
    supplier: "",
    brand: "",
    cost_price: "",
    margin_percentage: "",
    sale_price: "",
    stock_quantity: 0,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.reference_code.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.supplier.toLowerCase().includes(term)
    );
  }, [products, search]);

  async function handleCreate() {
    if (!form.name || !form.reference_code || !form.brand) return;

    try {
      setCreating(true);
      await createProduct({
        ...form,
        margin_percentage: form.margin_percentage || "0",
      });
      setDialogOpen(false);
      setForm({
        name: "",
        reference_code: "",
        supplier: "",
        brand: "",
        cost_price: "",
        margin_percentage: "",
        sale_price: "",
        stock_quantity: 0,
      });
      await loadProducts();
    } catch (error) {
      console.error("Erro ao criar produto:", error);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <PageLayout
        title="Produtos"
        searchPlaceholder="Buscar por nome, referência, marca ou fornecedor..."
        searchValue={search}
        onSearchChange={setSearch}
        onAdd={() => setDialogOpen(true)}
        addLabel="Novo Produto"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <IconLoader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <Table variant="card">
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Preço Venda</TableHead>
                <TableHead>Estoque</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-xs">{product.reference_code}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>{product.supplier}</TableCell>
                    <TableCell>R$ {product.sale_price}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.stock_quantity <= product.min_stock_quantity
                            ? "bg-destructive/10 text-destructive"
                            : "bg-status-done/10 text-status-done"
                        }`}
                      >
                        {product.stock_quantity} un.
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </PageLayout>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Novo Produto"
        onSubmit={handleCreate}
        submitLabel="Criar Produto"
        loading={creating}
      >
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nome *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome do produto"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Referência *</label>
              <Input
                value={form.reference_code}
                onChange={(e) => setForm({ ...form, reference_code: e.target.value })}
                placeholder="Código de referência"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Marca *</label>
              <Input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Ex: Bosch"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Fornecedor</label>
              <Input
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="Nome do fornecedor"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Preço Custo</label>
              <Input
                type="number"
                step="0.01"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Margem %</label>
              <Input
                type="number"
                step="0.01"
                value={form.margin_percentage}
                onChange={(e) => setForm({ ...form, margin_percentage: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Preço Venda</label>
              <Input
                type="number"
                step="0.01"
                value={form.sale_price}
                onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Estoque Inicial</label>
            <Input
              type="number"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}
