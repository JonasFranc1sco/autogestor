import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/layout/Dialog";
import { FormField, FormTextarea } from "@/components/ui/form";
import { createProduct, updateProduct, type Product } from "@/services/product.service";
import { tryParseDecimal } from "@/lib/format";
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

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  editing?: Product | null;
  onSaved: (product?: Product) => void;
}

export function ProductFormDialog({ open, onClose, editing, onSaved }: ProductFormDialogProps) {
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        reference_code: editing.reference_code ?? "",
        barcode: editing.barcode ?? "",
        description: editing.description ?? "",
        application: editing.application ?? "",
        supplier: editing.supplier ?? "",
        brand: editing.brand ?? "",
        cost_price: editing.cost_price ?? "",
        margin_percentage: editing.margin_percentage ?? "0",
        sale_price: editing.sale_price,
        stock_quantity: String(editing.stock_quantity),
        min_stock_quantity: editing.min_stock_quantity != null ? String(editing.min_stock_quantity) : "",
        location: editing.location ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setFieldErrors({});
  }, [open, editing]);

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Informe o nome do produto.";
    if (tryParseDecimal(form.cost_price) === null) {
      errors.cost_price = "Informe o preço de custo.";
    }
    if (tryParseDecimal(form.sale_price) === null) errors.sale_price = "Informe o preço de venda.";
    if (!editing && (Number(form.stock_quantity) < 0 || Number.isNaN(Number(form.stock_quantity)))) {
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
      min_stock_quantity: form.min_stock_quantity ? Number(form.min_stock_quantity) : null,
      location: form.location.trim() || null,
    };

    try {
      if (editing) {
        await updateProduct(editing.id, {
          ...basePayload,
          ...(parsedCost !== null ? { cost_price: parsedCost } : {}),
          ...(parsedMargin !== null ? { margin_percentage: parsedMargin } : {}),
        });
        toast.success("Produto atualizado com sucesso.");
        onSaved();
      } else {
        const created = await createProduct({
          ...basePayload,
          cost_price: parsedCost ?? "0.00",
          margin_percentage: parsedMargin ?? "0.00",
          stock_quantity: Number(form.stock_quantity) || 0,
        });
        toast.success("Produto cadastrado com sucesso.");
        onSaved(created);
      }
      onClose();
    } catch (error) {
      setFieldErrors(extractFieldErrors(error));
      toast.error(extractApiErrorMessage(error, "Não foi possível salvar o produto."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar Produto" : "Novo Produto"}
      onSubmit={() => void handleSubmit()}
      submitLabel={editing ? "Salvar alterações" : "Cadastrar"}
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
          label={editing ? "Estoque atual (ajustar em Estoque)" : "Estoque atual"}
          type="number"
          value={form.stock_quantity}
          onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
          disabled={Boolean(editing)}
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
  );
}
