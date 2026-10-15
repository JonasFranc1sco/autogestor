import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { IconLoader2, IconPencil, IconTrash } from "@tabler/icons-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { AddressForm, emptyAddress, validateAddress, type AddressFormValues } from "@/components/layout/AddressForm";
import { FormField, FormSelect } from "@/components/ui/form";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  type Client,
} from "@/services/client.service";
import { maskCpfCnpj, maskPhone, unmask, isValidCpfCnpj, toLocalPhoneDigits } from "@/lib/masks";
import { extractApiErrorMessage, extractFieldErrors } from "@/lib/errors";

interface FormValues {
  person_type: "PF" | "PJ";
  name: string;
  email: string;
  phone: string;
  document: string;
  responsible: string;
  address: AddressFormValues;
}

const emptyForm: FormValues = {
  person_type: "PF",
  name: "",
  email: "",
  phone: "",
  document: "",
  responsible: "",
  address: { ...emptyAddress },
};

export default function ClientsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      setClients(await getClients(query));
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível carregar os clientes."));
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

  function openEdit(client: Client) {
    setEditingId(client.id);
    setForm({
      person_type: client.person_type,
      name: client.name,
      email: client.email ?? "",
      phone: toLocalPhoneDigits(client.phone ?? ""),
      document: client.document ?? "",
      responsible: client.responsible ?? "",
      address: client.address
        ? {
            cep: client.address.cep,
            street: client.address.street,
            number: client.address.number,
            neighborhood: client.address.neighborhood,
            city: client.address.city,
            state: client.address.state,
            complement: client.address.complement ?? "",
          }
        : { ...emptyAddress },
    });
    setFieldErrors({});
    setDialogOpen(true);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Informe o nome.";
    if (form.document && !isValidCpfCnpj(form.document)) errors.document = "Informe um CPF ou CNPJ válido.";
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
      person_type: form.person_type,
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone ? `+55${unmask(form.phone)}` : null,
      document: form.document ? unmask(form.document) : null,
      responsible: form.responsible.trim() || null,
      address: hasAddress
        ? { ...form.address, complement: form.address.complement || "" }
        : null,
    };

    try {
      if (editingId) {
        await updateClient(editingId, payload);
        toast.success("Cliente atualizado com sucesso.");
      } else {
        await createClient(payload);
        toast.success("Cliente cadastrado com sucesso.");
      }
      setDialogOpen(false);
      await load(search);
    } catch (error) {
      const apiErrors = extractFieldErrors(error);
      setFieldErrors(
        Object.fromEntries(
          Object.entries(apiErrors).map(([key, value]) => [key.replace("address.", "address."), value]),
        ),
      );
      toast.error(extractApiErrorMessage(error, "Não foi possível salvar o cliente."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClient(deleteTarget.id);
      toast.success("Cliente removido com sucesso.");
      setDeleteTarget(null);
      await load(search);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível remover o cliente."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageLayout
      title="Clientes"
      searchPlaceholder="Buscar por nome, CPF/CNPJ ou e-mail..."
      searchValue={search}
      onSearchChange={setSearch}
      onAdd={openCreate}
      addLabel="Novo Cliente"
    >
      <div className="rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <IconLoader2 size={18} className="animate-spin" /> Carregando clientes...
          </div>
        ) : clients.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {search ? "Nenhum cliente encontrado para esta busca." : "Nenhum cliente cadastrado ainda."}
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3 max-sm:hidden">Documento</th>
                  <th className="px-4 py-3 max-md:hidden">Contato</th>
                  <th className="px-4 py-3 max-lg:hidden">Cidade</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">{client.document ?? "Sem documento"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-sm:hidden">{client.document ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground max-md:hidden">
                      {client.phone ?? "—"}
                      {client.email ? ` · ${client.email}` : ""}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-lg:hidden">
                      {client.address ? `${client.address.city}/${client.address.state}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(client)}
                          aria-label={`Editar ${client.name}`}
                          title="Editar"
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <IconPencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(client)}
                          aria-label={`Remover ${client.name}`}
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
              {clients.length} cliente(s) exibido(s)
            </p>
          </>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Editar Cliente" : "Novo Cliente"}
        onSubmit={() => void handleSubmit()}
        submitLabel={editingId ? "Salvar alterações" : "Cadastrar"}
        loading={saving}
        maxWidth="max-w-2xl"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            label="Tipo"
            value={form.person_type}
            onChange={(e) => setForm({ ...form, person_type: e.target.value as "PF" | "PJ" })}
          >
            <option value="PF">Pessoa Física (CPF)</option>
            <option value="PJ">Pessoa Jurídica (CNPJ)</option>
          </FormSelect>

          <FormField
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nome completo"
            error={fieldErrors.name}
          />

          <FormField
            label="CPF / CNPJ"
            optional
            value={maskCpfCnpj(form.document)}
            onChange={(e) => setForm({ ...form, document: e.target.value })}
            placeholder="000.000.000-00"
            error={fieldErrors.document}
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
            placeholder="cliente@email.com"
            error={fieldErrors.email}
          />

          <FormField
            label="Responsável"
            optional
            value={form.responsible}
            onChange={(e) => setForm({ ...form, responsible: e.target.value })}
            placeholder="Responsável / frotista"
            error={fieldErrors.responsible}
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
        title="Remover cliente"
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
