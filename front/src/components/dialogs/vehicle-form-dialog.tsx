import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/layout/Dialog";
import { FormField } from "@/components/ui/form";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { createVehicle, updateVehicle, type Vehicle } from "@/services/vehicle.service";
import { getClients, type Client } from "@/services/client.service";
import { maskPlate, isValidPlate } from "@/lib/masks";
import { extractApiErrorMessage, extractFieldErrors } from "@/lib/errors";

interface FormValues {
  owner_id: string;
  owner_label: string;
  license_plate: string;
  year: string;
  brand: string;
  model: string;
  color: string;
  chassis: string;
}

const emptyForm: FormValues = {
  owner_id: "",
  owner_label: "",
  license_plate: "",
  year: "",
  brand: "",
  model: "",
  color: "",
  chassis: "",
};

interface VehicleFormDialogProps {
  open: boolean;
  onClose: () => void;
  editing?: Vehicle | null;
  defaultValues?: { owner_id?: string; owner_label?: string };
  onSaved: (vehicle?: Vehicle) => void;
  /** Atalho: abre o cadastro de cliente sem sair do fluxo atual (issue #21). */
  onCreateClient?: () => void;
  /** Cliente recém-criado via atalho, para auto-seleção. */
  newClient?: Client | null;
}

export function VehicleFormDialog({
  open,
  onClose,
  editing,
  defaultValues,
  onSaved,
  onCreateClient,
  newClient,
}: VehicleFormDialogProps) {
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Congela defaultValues/newClient no momento da abertura.
  const defaultsRef = useRef(defaultValues);
  const newClientRef = useRef(newClient);
  if (open) defaultsRef.current = defaultValues;

  useEffect(() => {
    if (!open) return;
    const defaults = defaultsRef.current;
    if (editing) {
      setForm({
        owner_id: editing.owner.id,
        owner_label: editing.owner.name,
        license_plate: editing.license_plate ?? "",
        year: editing.year ? String(editing.year) : "",
        brand: editing.brand,
        model: editing.model,
        color: editing.color ?? "",
        chassis: editing.chassis ?? "",
      });
    } else {
      setForm({
        ...emptyForm,
        owner_id: defaults?.owner_id ?? "",
        owner_label: defaults?.owner_label ?? "",
      });
    }
    setFieldErrors({});
  }, [open, editing]);

  // Auto-seleciona cliente recém-criado pelo atalho (uma única vez).
  useEffect(() => {
    if (newClient && open && newClientRef.current !== newClient) {
      newClientRef.current = newClient;
      setForm((current) => ({ ...current, owner_id: newClient.id, owner_label: newClient.name }));
    }
    if (!open) newClientRef.current = null;
  }, [newClient, open]);

  const searchClients = useCallback(async (term: string): Promise<SearchableOption[]> => {
    const clients = await getClients(term || undefined);
    return clients.map((client) => ({
      id: client.id,
      primary: client.name,
      secondary: client.document ?? client.phone ?? undefined,
    }));
  }, []);

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.owner_id) errors.owner_id = "Selecione o proprietário.";
    if (!form.brand.trim()) errors.brand = "Informe a marca.";
    if (!form.model.trim()) errors.model = "Informe o modelo.";
    if (form.license_plate && !isValidPlate(form.license_plate)) {
      errors.license_plate = "Use o formato ABC1234 ou ABC1D23.";
    }
    if (form.year && (Number(form.year) < 1900 || Number(form.year) > 2100)) {
      errors.year = "Informe um ano válido.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSaving(true);
    const payload = {
      owner_id: form.owner_id,
      license_plate: form.license_plate ? maskPlate(form.license_plate) : null,
      year: form.year ? Number(form.year) : null,
      brand: form.brand.trim(),
      model: form.model.trim(),
      color: form.color.trim() || null,
      chassis: form.chassis.trim() || null,
    };

    try {
      if (editing) {
        await updateVehicle(editing.id, payload);
        toast.success("Veículo atualizado com sucesso.");
        onSaved();
      } else {
        const created = await createVehicle(payload);
        toast.success("Veículo cadastrado com sucesso.");
        onSaved(created);
      }
      onClose();
    } catch (error) {
      setFieldErrors(extractFieldErrors(error));
      toast.error(extractApiErrorMessage(error, "Não foi possível salvar o veículo."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar Veículo" : "Novo Veículo"}
      onSubmit={() => void handleSubmit()}
      submitLabel={editing ? "Salvar alterações" : "Cadastrar"}
      loading={saving}
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <SearchableSelect
            label="Proprietário"
            value={form.owner_id || null}
            initialLabel={form.owner_label || null}
            onChange={(id, option) =>
              setForm({ ...form, owner_id: id ?? "", owner_label: option?.primary ?? "" })
            }
            searchOptions={searchClients}
            placeholder="Digite o nome, CPF ou telefone..."
            error={fieldErrors.owner_id}
            createLabel="Novo cliente"
            onCreate={onCreateClient}
          />
        </div>

        <FormField
          label="Placa"
          optional
          value={maskPlate(form.license_plate)}
          onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
          placeholder="BRA2E19"
          error={fieldErrors.license_plate}
          maxLength={7}
        />

        <FormField
          label="Marca"
          value={form.brand}
          onChange={(e) => setForm({ ...form, brand: e.target.value })}
          placeholder="Volkswagen"
          error={fieldErrors.brand}
        />

        <FormField
          label="Modelo"
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          placeholder="Gol"
          error={fieldErrors.model}
        />

        <FormField
          label="Ano"
          optional
          type="number"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
          placeholder="2020"
          error={fieldErrors.year}
        />

        <FormField
          label="Cor"
          optional
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
          placeholder="Prata"
          error={fieldErrors.color}
        />

        <FormField
          label="Chassi"
          optional
          value={form.chassis}
          onChange={(e) => setForm({ ...form, chassis: e.target.value })}
          placeholder="9BWZZZ377VT004251"
          error={fieldErrors.chassis}
        />
      </div>
    </Dialog>
  );
}
