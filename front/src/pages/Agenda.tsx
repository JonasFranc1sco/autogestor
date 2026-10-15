import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconPencil, IconTrash, IconCheck, IconX, IconMoodSad } from "@tabler/icons-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { FormField, FormSelect, FormTextarea } from "@/components/ui/form";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  changeAppointmentStatus,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TRANSITIONS,
  type Appointment,
  type AppointmentStatus,
} from "@/services/appointment.service";
import { getClients, type Client } from "@/services/client.service";
import { getVehicles, type Vehicle } from "@/services/vehicle.service";
import { getEmployees, type Employee } from "@/services/employee.service";
import { formatDateTime } from "@/lib/format";
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
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAppointments(
        await getAppointments({
          ...(dateFrom ? { date_from: dateFrom } : {}),
          ...(dateTo ? { date_to: dateTo } : {}),
        }),
      );
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível carregar a agenda."));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void Promise.all([getClients(), getVehicles(), getEmployees()])
      .then(([clientList, vehicleList, employeeList]) => {
        setClients(clientList);
        setVehicles(vehicleList);
        setEmployees(employeeList);
      })
      .catch(() => toast.error("Não foi possível carregar os dados de apoio."));
  }, []);

  const clientVehicles = vehicles.filter((vehicle) => vehicle.owner.id === form.client_id);

  const filtered = appointments.filter((appointment) =>
    search
      ? appointment.client.name.toLowerCase().includes(search.toLowerCase()) ||
        (appointment.vehicle.license_plate ?? "").toLowerCase().includes(search.toLowerCase())
      : true,
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
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
      await load();
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
      await load();
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
      await load();
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
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <FormField
          label="Até"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <IconLoader2 size={18} className="animate-spin" /> Carregando agenda...
          </div>
        ) : filtered.length === 0 ? (
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
                {filtered.map((appointment) => (
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
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {filtered.length} agendamento(s) exibido(s)
            </p>
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
          <FormSelect
            label="Cliente"
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value, vehicle_id: "" })}
            error={fieldErrors.client_id}
          >
            <option value="">Selecione o cliente...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Veículo"
            value={form.vehicle_id}
            onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
            error={fieldErrors.vehicle_id}
            disabled={!form.client_id}
          >
            <option value="">
              {form.client_id ? "Selecione o veículo..." : "Selecione o cliente primeiro"}
            </option>
            {clientVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.license_plate ?? "Sem placa"} — {vehicle.brand} {vehicle.model}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Mecânico"
            optional
            value={form.mechanic_id}
            onChange={(e) => setForm({ ...form, mechanic_id: e.target.value })}
          >
            <option value="">Nenhum</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </FormSelect>

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
    </PageLayout>
  );
}
