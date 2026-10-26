import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconPencil, IconTrash, IconCheck, IconX, IconMoodSad } from "@tabler/icons-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { FormField, FormTextarea } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import {
  getAppointmentsPaginated,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  changeAppointmentStatus,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TRANSITIONS,
  type Appointment,
  type AppointmentStatus,
} from "@/services/appointment.service";
import { getClients } from "@/services/client.service";
import { getVehicles } from "@/services/vehicle.service";
import { getEmployees } from "@/services/employee.service";
import { isInvalidPageError } from "@/services/pagination";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { ClientFormDialog } from "@/components/dialogs/client-form-dialog";
import { VehicleFormDialog } from "@/components/dialogs/vehicle-form-dialog";
import { formatDateTime } from "@/lib/format";
import { maskCpfCnpj } from "@/lib/masks";
import { extractApiErrorMessage, extractFieldErrors } from "@/lib/errors";

const statusClasses: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-status-open/10 text-status-open",
  COMPLETED: "bg-status-done/10 text-status-done",
  NO_SHOW: "bg-status-waiting/10 text-status-waiting",
  CANCELLED: "bg-status-cancelled/10 text-status-cancelled",
};

const statusActions: Partial<Record<AppointmentStatus, { label: string; icon: typeof IconCheck }>> = {
  COMPLETED: { label: "Realizado", icon: IconCheck },
  NO_SHOW: { label: "Não compareceu", icon: IconMoodSad },
  CANCELLED: { label: "Cancelar", icon: IconX },
};

interface FormValues {
  client_id: string;
  vehicle_id: string;
  mechanic_id: string;
  date: string;
  time: string;
  duration: string;
  description: string;
}

const emptyForm: FormValues = {
  client_id: "",
  vehicle_id: "",
  mechanic_id: "",
  date: "",
  time: "",
  duration: "60",
  description: "",
};

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function toTimeInput(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [clientLabel, setClientLabel] = useState("");
  const [vehicleLabel, setVehicleLabel] = useState("");
  const [mechanicLabel, setMechanicLabel] = useState("");
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (targetPage: number, query?: string, from?: string, to?: string) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      try {
        const data = await getAppointmentsPaginated({
          page: targetPage,
          search: query,
          ...(from ? { date_from: from } : {}),
          ...(to ? { date_to: to } : {}),
        });
        if (requestId !== requestIdRef.current) return;
        setAppointments(data.results);
        setTotalCount(data.count);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        if (targetPage > 1 && isInvalidPageError(error)) {
          setPage((current) => Math.max(1, current - 1));
          return;
        }
        toast.error(extractApiErrorMessage(error, "Não foi possível carregar a agenda."));
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  useEffect(() => {
    void load(page, debouncedSearch, dateFrom, dateTo);
  }, [page, debouncedSearch, dateFrom, dateTo, load]);

  const searchClients = useCallback(async (term: string): Promise<SearchableOption[]> => {
    const list = await getClients(term || undefined);
    return list.map((client) => ({
      id: client.id,
      primary: client.name,
      secondary: client.document ? maskCpfCnpj(client.document) : client.phone ?? undefined,
    }));
  }, []);

  const searchVehicles = useCallback(
    async (term: string): Promise<SearchableOption[]> => {
      if (!form.client_id) return [];
      const list = await getVehicles(term || undefined, form.client_id);
      return list.map((vehicle) => ({
        id: vehicle.id,
        primary: `${vehicle.license_plate ?? "Sem placa"} — ${vehicle.brand} ${vehicle.model}`,
        secondary: vehicle.owner.name,
      }));
    },
    [form.client_id],
  );

  const searchMechanics = useCallback(async (term: string): Promise<SearchableOption[]> => {
    const list = await getEmployees(term || undefined);
    return list.map((employee) => ({
      id: employee.id,
      primary: employee.name,
      secondary: employee.email ?? undefined,
    }));
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setClientLabel("");
    setVehicleLabel("");
    setMechanicLabel("");
    setFieldErrors({});
    setDialogOpen(true);
  }

  function openEdit(appointment: Appointment) {
    setEditingId(appointment.id);
    setForm({
      client_id: appointment.client.id,
      vehicle_id: appointment.vehicle.id,
      mechanic_id: appointment.mechanic?.id ?? "",
      date: toDateInput(appointment.scheduled_at),
      time: toTimeInput(appointment.scheduled_at),
      duration: String(appointment.expected_duration_minutes),
      description: appointment.description ?? "",
    });
    setClientLabel(appointment.client.name);
    setVehicleLabel(`${appointment.vehicle.license_plate ?? "Sem placa"} — ${appointment.vehicle.brand} ${appointment.vehicle.model}`);
    setMechanicLabel(appointment.mechanic?.name ?? "");
    setFieldErrors({});
    setDialogOpen(true);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.client_id) errors.client_id = "Selecione o cliente.";
    if (!form.vehicle_id) errors.vehicle_id = "Selecione o veículo.";
    if (!form.date) errors.date = "Informe a data.";
    if (!form.time) errors.time = "Informe o horário.";
    if (Number(form.duration) < 1) errors.duration = "A duração deve ser de pelo menos 1 minuto.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSaving(true);
    const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString();
    const payload = {
      client_id: form.client_id,
      vehicle_id: form.vehicle_id,
      mechanic_id: form.mechanic_id || null,
      scheduled_at: scheduledAt,
      expected_duration_minutes: Number(form.duration),
      description: form.description.trim() || undefined,
    };

    try {
      if (editingId) {
        await updateAppointment(editingId, payload);
        toast.success("Agendamento atualizado com sucesso.");
      } else {
        await createAppointment(payload);
        toast.success("Agendamento criado com sucesso.");
      }
      setDialogOpen(false);
      await load(page, debouncedSearch, dateFrom, dateTo);
    } catch (error) {
      setFieldErrors(extractFieldErrors(error));
      toast.error(extractApiErrorMessage(error, "Não foi possível salvar o agendamento."));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(appointment: Appointment, status: AppointmentStatus) {
    try {
      await changeAppointmentStatus(appointment.id, status);
      toast.success(`Agendamento marcado como "${APPOINTMENT_STATUS_LABELS[status]}".`);
      await load(page, debouncedSearch, dateFrom, dateTo);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível alterar o status."));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAppointment(deleteTarget.id);
      toast.success("Agendamento removido com sucesso.");
      setDeleteTarget(null);
      await load(page, debouncedSearch, dateFrom, dateTo);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível remover o agendamento."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageLayout
      title="Agenda"
      searchPlaceholder="Buscar por cliente ou placa..."
      searchValue={search}
      onSearchChange={setSearch}
      onAdd={openCreate}
      addLabel="Novo Agendamento"
    >
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl">
        <FormField
          label="De"
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
        />
        <FormField
          label="Até"
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <IconLoader2 size={18} className="animate-spin" /> Carregando agenda...
          </div>
        ) : appointments.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {dateFrom || dateTo || search
              ? "Nenhum agendamento encontrado para os filtros."
              : "Nenhum agendamento registrado ainda."}
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Data/Hora</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 max-md:hidden">Veículo</th>
                  <th className="px-4 py-3 max-lg:hidden">Mecânico</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{formatDateTime(appointment.scheduled_at)}</p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.expected_duration_minutes} min
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{appointment.client.name}</p>
                      <p className="text-xs text-muted-foreground md:hidden">
                        {appointment.vehicle.license_plate ?? appointment.vehicle.model}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-md:hidden">
                      {appointment.vehicle.license_plate ?? appointment.vehicle.model}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-lg:hidden">
                      {appointment.mechanic?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[appointment.status]}`}>
                        {APPOINTMENT_STATUS_LABELS[appointment.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        {(APPOINTMENT_STATUS_TRANSITIONS[appointment.status] ?? []).map((next) => {
                          const action = statusActions[next];
                          if (!action) return null;
                          const Icon = action.icon;
                          return (
                            <button
                              key={next}
                              type="button"
                              onClick={() => void handleStatusChange(appointment, next)}
                              title={action.label}
                              aria-label={`${action.label} agendamento de ${appointment.client.name}`}
                              className={`rounded-lg p-2 transition-colors ${
                                next === "CANCELLED"
                                  ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  : "text-muted-foreground hover:bg-status-done/10 hover:text-status-done"
                              }`}
                            >
                              <Icon size={16} />
                            </button>
                          );
                        })}
                        {appointment.status === "SCHEDULED" && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(appointment)}
                              title="Editar"
                              aria-label={`Editar agendamento de ${appointment.client.name}`}
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            >
                              <IconPencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(appointment)}
                              title="Remover"
                              aria-label={`Remover agendamento de ${appointment.client.name}`}
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <IconTrash size={16} />
                            </button>
                          </>
                        )}
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
              itemLabel="agendamento(s)"
            />
          </>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Editar Agendamento" : "Novo Agendamento"}
        onSubmit={() => void handleSubmit()}
        submitLabel={editingId ? "Salvar alterações" : "Agendar"}
        loading={saving}
        maxWidth="max-w-2xl"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SearchableSelect
            label="Cliente"
            value={form.client_id || null}
            initialLabel={clientLabel || null}
            onChange={(id, option) => {
              setForm({ ...form, client_id: id ?? "", vehicle_id: "" });
              setClientLabel(option?.primary ?? "");
              setVehicleLabel("");
            }}
            searchOptions={searchClients}
            placeholder="Digite o nome, CPF ou telefone..."
            error={fieldErrors.client_id}
            createLabel="Novo cliente"
            onCreate={() => setClientDialogOpen(true)}
          />

          <SearchableSelect
            label="Veículo"
            value={form.vehicle_id || null}
            initialLabel={vehicleLabel || null}
            onChange={(id, option) => {
              setForm({ ...form, vehicle_id: id ?? "" });
              setVehicleLabel(option?.primary ?? "");
            }}
            searchOptions={searchVehicles}
            placeholder={form.client_id ? "Digite a placa, marca ou modelo..." : "Selecione o cliente primeiro"}
            error={fieldErrors.vehicle_id}
            disabled={!form.client_id}
            createLabel="Novo veículo"
            onCreate={() => setVehicleDialogOpen(true)}
          />

          <SearchableSelect
            label="Mecânico"
            optional
            value={form.mechanic_id || null}
            initialLabel={mechanicLabel || null}
            onChange={(id, option) => {
              setForm({ ...form, mechanic_id: id ?? "" });
              setMechanicLabel(option?.primary ?? "");
            }}
            searchOptions={searchMechanics}
            placeholder="Digite o nome do mecânico..."
          />

          <FormField
            label="Duração (minutos)"
            type="number"
            min={1}
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            error={fieldErrors.duration}
          />

          <FormField
            label="Data"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            error={fieldErrors.date}
          />

          <FormField
            label="Horário"
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            error={fieldErrors.time}
          />

          <div className="sm:col-span-2">
            <FormTextarea
              label="Descrição"
              optional
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descrição do serviço agendado"
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remover agendamento"
        onSubmit={() => void handleDelete()}
        submitLabel="Remover"
        loading={deleting}
        destructive
        maxWidth="max-w-md"
      >
        <p className="text-sm">
          Tem certeza que deseja remover o agendamento de{" "}
          <strong>{deleteTarget?.client.name}</strong> em{" "}
          {deleteTarget ? formatDateTime(deleteTarget.scheduled_at) : ""}?
        </p>
      </Dialog>

      <ClientFormDialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        onSaved={(client) => {
          if (client) {
            setForm((current) => ({ ...current, client_id: client.id, vehicle_id: "" }));
            setClientLabel(client.name);
            setVehicleLabel("");
          }
        }}
      />

      <VehicleFormDialog
        open={vehicleDialogOpen}
        onClose={() => setVehicleDialogOpen(false)}
        defaultValues={
          form.client_id ? { owner_id: form.client_id, owner_label: clientLabel } : undefined
        }
        onSaved={(vehicle) => {
          if (vehicle) {
            setForm((current) => ({ ...current, vehicle_id: vehicle.id }));
            setVehicleLabel(`${vehicle.license_plate ?? "Sem placa"} — ${vehicle.brand} ${vehicle.model}`);
          }
        }}
      />
    </PageLayout>
  );
}
