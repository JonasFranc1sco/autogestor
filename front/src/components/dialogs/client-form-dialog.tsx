import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/layout/Dialog";
import { AddressForm, emptyAddress, validateAddress, type AddressFormValues } from "@/components/layout/AddressForm";
import { FormField, FormSelect } from "@/components/ui/form";
import { createClient, updateClient, type Client } from "@/services/client.service";
import { maskCpf, maskCnpj, maskPhone, isValidCpf, isValidCnpj, isValidPhone, phoneToE164, toLocalPhoneDigits, unmask } from "@/lib/masks";
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

interface ClientFormDialogProps {
  open: boolean;
  onClose: () => void;
  editing?: Client | null;
  defaultValues?: Partial<FormValues>;
  onSaved: (client?: Client) => void;
}

export function ClientFormDialog({ open, onClose, editing, defaultValues, onSaved }: ClientFormDialogProps) {
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Congela defaultValues no momento da abertura (objeto inline do pai não pode resetar o form).
  const defaultsRef = useRef(defaultValues);
  if (open) defaultsRef.current = defaultValues;

  useEffect(() => {
    if (!open) return;
    const defaults = defaultsRef.current;
    if (editing) {
      setForm({
        person_type: editing.person_type,
        name: editing.name,
        email: editing.email ?? "",
        phone: toLocalPhoneDigits(editing.phone ?? ""),
        document: unmask(editing.document ?? ""),
        responsible: editing.responsible ?? "",
        address: editing.address
          ? {
              cep: editing.address.cep,
              street: editing.address.street,
              number: editing.address.number,
              neighborhood: editing.address.neighborhood,
              city: editing.address.city,
              state: editing.address.state,
              complement: editing.address.complement ?? "",
            }
          : { ...emptyAddress },
      });
    } else {
      setForm({ ...emptyForm, ...defaults, address: { ...emptyAddress, ...defaults?.address } });
    }
    setFieldErrors({});
  }, [open, editing]);

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Informe o nome.";
    if (form.document) {
      if (form.person_type === "PJ" && !isValidCnpj(form.document)) {
        errors.document = "Informe um CNPJ válido.";
      } else if (form.person_type === "PF" && !isValidCpf(form.document)) {
        errors.document = "Informe um CPF válido.";
      }
    }
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
      person_type: form.person_type,
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: phoneToE164(form.phone),
      document: form.document ? unmask(form.document) : null,
      responsible: form.responsible.trim() || null,
      address: hasAddress ? { ...form.address, complement: form.address.complement || "" } : null,
    };

    try {
      if (editing) {
        await updateClient(editing.id, payload);
        toast.success("Cliente atualizado com sucesso.");
        onSaved();
      } else {
        const created = await createClient(payload);
        toast.success("Cliente cadastrado com sucesso.");
        onSaved(created);
      }
      onClose();
    } catch (error) {
      setFieldErrors(extractFieldErrors(error));
      toast.error(extractApiErrorMessage(error, "Não foi possível salvar o cliente."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar Cliente" : "Novo Cliente"}
      onSubmit={() => void handleSubmit()}
      submitLabel={editing ? "Salvar alterações" : "Cadastrar"}
      loading={saving}
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          label="Tipo"
          value={form.person_type}
          onChange={(e) => {
            const nextType = e.target.value as "PF" | "PJ";
            setForm({
              ...form,
              person_type: nextType,
              document: unmask(form.document).slice(0, nextType === "PJ" ? 14 : 11),
            });
          }}
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
          inputMode="numeric"
          value={form.person_type === "PJ" ? maskCnpj(form.document) : maskCpf(form.document)}
          onChange={(e) =>
            setForm({
              ...form,
              document: unmask(e.target.value).slice(0, form.person_type === "PJ" ? 14 : 11),
            })
          }
          placeholder={form.person_type === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
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
  );
}
