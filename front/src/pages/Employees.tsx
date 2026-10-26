import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { IconLoader2, IconPencil, IconTrash } from "@tabler/icons-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { AddressForm, emptyAddress, validateAddress, type AddressFormValues } from "@/components/layout/AddressForm";
import { FormField } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import {
  getEmployeesPaginated,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  type Employee,
} from "@/services/employee.service";
import { isInvalidPageError } from "@/services/pagination";
import { maskCpf, maskCpfCnpj, maskPhone, isValidCpf, isValidPhone, phoneToE164, toLocalPhoneDigits, unmask } from "@/lib/masks";
import { extractApiErrorMessage, extractFieldErrors } from "@/lib/errors";

interface FormValues {
  name: string;
  email: string;
  phone: string;
  document_cpf: string;
  document_rg: string;
  address: AddressFormValues;
}

const emptyForm: FormValues = {
  name: "",
  email: "",
  phone: "",
  document_cpf: "",
  document_rg: "",
  address: { ...emptyAddress },
};

export default function EmployeesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const requestIdRef = useRef(0);

  const load = useCallback(async (targetPage: number, query?: string) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await getEmployeesPaginated({ page: targetPage, search: query });
      if (requestId !== requestIdRef.current) return;
      setEmployees(data.results);
      setTotalCount(data.count);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      if (targetPage > 1 && isInvalidPageError(error)) {
        setPage((current) => Math.max(1, current - 1));
        return;
      }
      toast.error(extractApiErrorMessage(error, "Não foi possível carregar os funcionários."));
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
    void load(page, debouncedSearch);
  }, [page, debouncedSearch, load]);

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

  function openEdit(employee: Employee) {
    setEditingId(employee.id);
    setForm({
      name: employee.name,
      email: employee.email ?? "",
      phone: toLocalPhoneDigits(employee.phone ?? ""),
      document_cpf: unmask(employee.document_cpf ?? ""),
      document_rg: employee.document_rg ?? "",
      address: employee.address
        ? {
            cep: employee.address.cep,
            street: employee.address.street,
            number: employee.address.number,
            neighborhood: employee.address.neighborhood,
            city: employee.address.city,
            state: employee.address.state,
            complement: employee.address.complement ?? "",
          }
        : { ...emptyAddress },
    });
    setFieldErrors({});
    setDialogOpen(true);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Informe o nome.";
    if (form.document_cpf && !isValidCpf(form.document_cpf)) errors.document_cpf = "Informe um CPF válido.";
    if (form.phone && !isValidPhone(form.phone)) errors.phone = "Informe o telefone com DDD.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Informe um e-mail válido.";

    const hasAddress = Object.values(form.address).some((value) => value.trim() !== "");
    const addressErrors = hasAddress ? validateAddress(form.address) : {};

    const merged: Record<string, string> = { ...errors };
    for (const [key, value] of Object.entries(addressErrors)) merged[`address.${key}`] = value;

    setFieldErrors(merged);
    return Object.keys(merged).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSaving(true);
    const hasAddress = Object.values(form.address).some((value) => value.trim() !== "");
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: phoneToE164(form.phone),
      document_cpf: form.document_cpf ? unmask(form.document_cpf) : null,
      document_rg: form.document_rg.trim() || null,
      address: hasAddress ? { ...form.address, complement: form.address.complement || "" } : null,
    };

    try {
      if (editingId) {
        await updateEmployee(editingId, payload);
        toast.success("Funcionário atualizado com sucesso.");
      } else {
        await createEmployee(payload);
        toast.success("Funcionário cadastrado com sucesso.");
      }
      setDialogOpen(false);
      await load(page, debouncedSearch);
    } catch (error) {
      setFieldErrors(extractFieldErrors(error));
      toast.error(extractApiErrorMessage(error, "Não foi possível salvar o funcionário."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget.id);
      toast.success("Funcionário removido com sucesso.");
      setDeleteTarget(null);
      await load(page, debouncedSearch);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível remover o funcionário."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageLayout
      title="Funcionários"
      searchPlaceholder="Buscar por nome, CPF ou e-mail..."
      searchValue={search}
      onSearchChange={setSearch}
      onAdd={openCreate}
      addLabel="Novo Funcionário"
    >
      <div className="rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <IconLoader2 size={18} className="animate-spin" /> Carregando funcionários...
          </div>
        ) : employees.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {search ? "Nenhum funcionário encontrado para esta busca." : "Nenhum funcionário cadastrado ainda."}
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3 max-sm:hidden">CPF</th>
                  <th className="px-4 py-3 max-md:hidden">Contato</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">{employee.document_cpf ? maskCpfCnpj(employee.document_cpf) : "Sem CPF"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-sm:hidden">{employee.document_cpf ? maskCpfCnpj(employee.document_cpf) : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground max-md:hidden">
                      {employee.phone ?? "—"}
                      {employee.email ? ` · ${employee.email}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(employee)}
                          aria-label={`Editar ${employee.name}`}
                          title="Editar"
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <IconPencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(employee)}
                          aria-label={`Remover ${employee.name}`}
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
            <Pagination
              currentPage={page}
              totalCount={totalCount}
              onPageChange={setPage}
              itemLabel="funcionário(s)"
            />
          </>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Editar Funcionário" : "Novo Funcionário"}
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
            placeholder="Nome completo"
            error={fieldErrors.name}
          />

          <FormField
            label="CPF"
            optional
            inputMode="numeric"
            value={maskCpf(form.document_cpf)}
            onChange={(e) => setForm({ ...form, document_cpf: unmask(e.target.value).slice(0, 11) })}
            placeholder="000.000.000-00"
            error={fieldErrors.document_cpf}
          />

          <FormField
            label="RG"
            optional
            value={form.document_rg}
            onChange={(e) => setForm({ ...form, document_rg: e.target.value })}
            placeholder="RG"
            error={fieldErrors.document_rg}
          />

          <FormField
            label="Telefone"
            optional
            value={maskPhone(form.phone)}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="(62) 99999-0000"
            error={fieldErrors.phone}
          />

          <FormField
            label="E-mail"
            optional
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="funcionario@email.com"
            error={fieldErrors.email}
          />
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Endereço</h3>
          <AddressForm
            values={form.address}
            onChange={(address) => setForm({ ...form, address })}
            errors={Object.fromEntries(
              Object.entries(fieldErrors)
                .filter(([key]) => key.startsWith("address."))
                .map(([key, value]) => [key.replace("address.", ""), value]),
            )}
          />
        </div>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remover funcionário"
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
