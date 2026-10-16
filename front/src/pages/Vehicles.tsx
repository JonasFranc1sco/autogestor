import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { IconLoader2, IconPencil, IconTrash } from "@tabler/icons-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { FormField, FormSelect } from "@/components/ui/form";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  type Vehicle,
} from "@/services/vehicle.service";
import { getClients, type Client } from "@/services/client.service";
import { maskPlate, isValidPlate } from "@/lib/masks";
import { tryParseDecimal, tryParseDecimalNumber } from "@/lib/format";
import { extractApiErrorMessage, extractFieldErrors } from "@/lib/errors";

interface FormValues {
  owner_id: string;
  license_plate: string;
  year: string;
  brand: string;
  mileage: string;
  model: string;
  color: string;
  chassis: string;
}

const emptyForm: FormValues = {
  owner_id: "",
  license_plate: "",
  year: "",
  brand: "",
  mileage: "",
  model: "",
  color: "",
  chassis: "",
};

export default function VehiclesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      setVehicles(await getVehicles(query));
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível carregar os veículos."));
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
    getClients()
      .then(setClients)
      .catch(() => toast.error("Não foi possível carregar os clientes para seleção."));
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

  function openEdit(vehicle: Vehicle) {
    setEditingId(vehicle.id);
    setForm({
      owner_id: vehicle.owner.id,
      license_plate: vehicle.license_plate ?? "",
      year: vehicle.year ? String(vehicle.year) : "",
      brand: vehicle.brand,
      mileage: vehicle.mileage ?? "",
      model: vehicle.model,
      color: vehicle.color ?? "",
      chassis: vehicle.chassis ?? "",
    });
    setFieldErrors({});
    setDialogOpen(true);
  }

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
    if (form.mileage.trim()) {
      const parsedMileage = tryParseDecimalNumber(form.mileage);
      if (parsedMileage === null || parsedMileage < 0) {
        errors.mileage = "Informe uma quilometragem válida.";
      }
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
      mileage: form.mileage.trim() ? tryParseDecimal(form.mileage) : null,
    };

    try {
      if (editingId) {
        await updateVehicle(editingId, payload);
        toast.success("Veículo atualizado com sucesso.");
      } else {
        await createVehicle(payload);
        toast.success("Veículo cadastrado com sucesso.");
      }
      setDialogOpen(false);
      await load(search);
    } catch (error) {
      setFieldErrors(extractFieldErrors(error));
      toast.error(extractApiErrorMessage(error, "Não foi possível salvar o veículo."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVehicle(deleteTarget.id);
      toast.success("Veículo removido com sucesso.");
      setDeleteTarget(null);
      await load(search);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível remover o veículo."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageLayout
      title="Veículos"
      searchPlaceholder="Buscar por placa, marca, modelo ou proprietário..."
      searchValue={search}
      onSearchChange={setSearch}
      onAdd={openCreate}
      addLabel="Novo Veículo"
    >
      <div className="rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <IconLoader2 size={18} className="animate-spin" /> Carregando veículos...
          </div>
        ) : vehicles.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {search ? "Nenhum veículo encontrado para esta busca." : "Nenhum veículo cadastrado ainda."}
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Placa</th>
                  <th className="px-4 py-3">Veículo</th>
                  <th className="px-4 py-3 max-md:hidden">Proprietário</th>
                  <th className="px-4 py-3 max-lg:hidden">Ano</th>
                  <th className="px-4 py-3 max-lg:hidden">Quilometragem</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium">{vehicle.license_plate ?? "Sem placa"}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{vehicle.owner.name}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {vehicle.brand} {vehicle.model}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-md:hidden">{vehicle.owner.name}</td>
                    <td className="px-4 py-3 text-muted-foreground max-lg:hidden">{vehicle.year ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground max-lg:hidden">{vehicle.mileage ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(vehicle)}
                          aria-label={`Editar ${vehicle.license_plate ?? "veículo"}`}
                          title="Editar"
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <IconPencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(vehicle)}
                          aria-label={`Remover ${vehicle.license_plate ?? "veículo"}`}
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
              {vehicles.length} veículo(s) exibido(s)
            </p>
          </>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Editar Veículo" : "Novo Veículo"}
        onSubmit={() => void handleSubmit()}
        submitLabel={editingId ? "Salvar alterações" : "Cadastrar"}
        loading={saving}
        maxWidth="max-w-2xl"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            label="Proprietário"
            value={form.owner_id}
            onChange={(e) => setForm({ ...form, owner_id: e.target.value })}
            error={fieldErrors.owner_id}
          >
            <option value="">Selecione o cliente...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </FormSelect>

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
            className="sm:col-span-2"
          />
          <FormField
            label="Quilometragem"
            optional
            inputMode="decimal"
            value={form.mileage}
            onChange={(e) => setForm({ ...form, mileage: e.target.value })}
            placeholder="21.000,00"
            error={fieldErrors.mileage}
            className="sm:col-span-2"
          />
        </div>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remover veículo"
        onSubmit={() => void handleDelete()}
        submitLabel="Remover"
        loading={deleting}
        destructive
        maxWidth="max-w-md"
      >
        <p className="text-sm">
          Tem certeza que deseja remover <strong>{deleteTarget?.license_plate ?? "este veículo"}</strong>?
          O registro será ocultado e poderá ser restaurado manualmente.
        </p>
      </Dialog>
    </PageLayout>
  );
}
