import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { IconLoader2, IconPencil, IconTrash } from "@tabler/icons-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { FormField, FormSelect, FormTextarea } from "@/components/ui/form";
import {
  getServices,
  createService,
  updateService,
  deleteService,
  type Service,
} from "@/services/service.service";
import { getEmployees, type Employee } from "@/services/employee.service";
import { formatCurrency, tryParseDecimal } from "@/lib/format";
import { extractApiErrorMessage, extractFieldErrors } from "@/lib/errors";

interface FormValues {
  name: string;
  description: string;
  employee_id: string;
  cost_price: string;
  sale_price: string;
}

const emptyForm: FormValues = {
  name: "",
  description: "",
  employee_id: "",
  cost_price: "0",
  sale_price: "",
};

export default function ServicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      setServices(await getServices(query));
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível carregar os serviços."));
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
    getEmployees()
      .then(setEmployees)
      .catch(() => toast.error("Não foi possível carregar os funcionários."));
  }, []);

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

  function openEdit(service: Service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description ?? "",
      employee_id: service.employee?.id ?? "",
      cost_price: service.cost_price ?? "0",
      sale_price: service.sale_price,
    });
    setFieldErrors({});
    setDialogOpen(true);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Informe o nome do serviço.";
    if (tryParseDecimal(form.sale_price) === null) errors.sale_price = "Informe o preço de venda.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSaving(true);
    const parsedCost = tryParseDecimal(form.cost_price);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      employee_id: form.employee_id || null,
      ...(parsedCost !== null ? { cost_price: parsedCost } : {}),
      sale_price: tryParseDecimal(form.sale_price) ?? "0.00",
    };

    try {
      if (editingId) {
        await updateService(editingId, payload);
        toast.success("Serviço atualizado com sucesso.");
      } else {
        await createService(payload);
        toast.success("Serviço cadastrado com sucesso.");
      }
      setDialogOpen(false);
      await load(search);
    } catch (error) {
      setFieldErrors(extractFieldErrors(error));
      toast.error(extractApiErrorMessage(error, "Não foi possível salvar o serviço."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteService(deleteTarget.id);
      toast.success("Serviço removido com sucesso.");
      setDeleteTarget(null);
      await load(search);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível remover o serviço."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageLayout
      title="Serviços"
      searchPlaceholder="Buscar serviço..."
      searchValue={search}
      onSearchChange={setSearch}
      onAdd={openCreate}
      addLabel="Novo Serviço"
    >
      <div className="rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <IconLoader2 size={18} className="animate-spin" /> Carregando serviços...
          </div>
        ) : services.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {search ? "Nenhum serviço encontrado para esta busca." : "Nenhum serviço cadastrado ainda."}
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Serviço</th>
                  <th className="px-4 py-3 max-md:hidden">Responsável</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium">{service.name}</p>
                      {service.description && (
                        <p className="truncate text-xs text-muted-foreground">{service.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-md:hidden">
                      {service.employee?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(service.sale_price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(service)}
                          aria-label={`Editar ${service.name}`}
                          title="Editar"
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <IconPencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(service)}
                          aria-label={`Remover ${service.name}`}
                          title="Remover"
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {services.length} serviço(s) exibido(s)
            </p>
          </>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Editar Serviço" : "Novo Serviço"}
        onSubmit={() => void handleSubmit()}
        submitLabel={editingId ? "Salvar alterações" : "Cadastrar"}
        loading={saving}
        maxWidth="max-w-lg"
      >
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Troca de óleo e filtro"
            error={fieldErrors.name}
          />

          <FormSelect
            label="Responsável"
            optional
            value={form.employee_id}
            onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
            error={fieldErrors.employee_id}
          >
            <option value="">Nenhum</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </FormSelect>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Preço de custo (R$)"
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
              placeholder="0,00"
              inputMode="decimal"
              error={fieldErrors.cost_price}
            />

            <FormField
              label="Preço de venda (R$)"
              value={form.sale_price}
              onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
              placeholder="100,00"
              inputMode="decimal"
              error={fieldErrors.sale_price}
            />
          </div>

          <FormTextarea
            label="Descrição"
            optional
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descrição do serviço"
            error={fieldErrors.description}
          />
        </div>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remover serviço"
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
