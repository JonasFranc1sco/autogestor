import { api } from "./api";
import { LIST_PAGE_SIZE, type Paginated } from "./pagination";

export type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Realizado",
  NO_SHOW: "Não compareceu",
  CANCELLED: "Cancelado",
};

export const APPOINTMENT_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  SCHEDULED: ["COMPLETED", "NO_SHOW", "CANCELLED"],
  COMPLETED: [],
  NO_SHOW: [],
  CANCELLED: [],
};

export interface Appointment {
  id: string;
  client: { id: string; name: string; document: string | null };
  vehicle: { id: string; license_plate: string | null; brand: string; model: string; mileage?: string | null };
  mechanic: { id: string; name: string } | null;
  service_order: string | null;
  scheduled_at: string;
  expected_duration_minutes: number;
  description: string | null;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
}

export interface AppointmentCreateData {
  client_id: string;
  vehicle_id: string;
  mechanic_id?: string | null;
  scheduled_at: string;
  expected_duration_minutes?: number;
  description?: string;
}

export type AppointmentUpdateData = Partial<AppointmentCreateData>;

export async function getAppointments(filters?: {
  date_from?: string;
  date_to?: string;
  status?: string;
}): Promise<Appointment[]> {
  const response = await api.get<Paginated<Appointment>>("/api/appointments/", {
    params: { page_size: LIST_PAGE_SIZE, ...filters },
  });
  return response.data.results;
}

export async function createAppointment(data: AppointmentCreateData): Promise<Appointment> {
  const response = await api.post<Appointment>("/api/appointments/", data);
  return response.data;
}

export async function updateAppointment(id: string, data: AppointmentUpdateData): Promise<Appointment> {
  const response = await api.patch<Appointment>(`/api/appointments/${id}/`, data);
  return response.data;
}

export async function deleteAppointment(id: string): Promise<void> {
  await api.delete(`/api/appointments/${id}/`);
}

export async function changeAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const response = await api.post<Appointment>(`/api/appointments/${id}/change-status/`, { status });
  return response.data;
}
