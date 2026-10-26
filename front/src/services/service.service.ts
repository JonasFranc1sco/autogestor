import { api } from "./api";
import { DEFAULT_PAGE_SIZE, LIST_PAGE_SIZE, type Paginated } from "./pagination";

export interface Service {
  id: string;
  name: string;
  description: string | null;
  employee: {
    id: string;
    name: string;
  } | null;
  cost_price?: string;
  margin_percentage?: string;
  sale_price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceCreateData {
  name: string;
  description?: string | null;
  employee_id?: string | null;
  cost_price?: string;
  margin_percentage?: string;
  sale_price: string;
}

export type ServiceUpdateData = Partial<ServiceCreateData>;

export async function getServices(search?: string): Promise<Service[]> {
  const response = await api.get<Paginated<Service>>("/api/services/", {
    params: { page_size: LIST_PAGE_SIZE, ...(search ? { search } : {}) },
  });
  return response.data.results;
}

export async function getServicesPaginated(params?: {
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<Paginated<Service>> {
  const response = await api.get<Paginated<Service>>("/api/services/", {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? DEFAULT_PAGE_SIZE,
      ...(params?.search ? { search: params.search } : {}),
    },
  });
  return response.data;
}

export async function createService(data: ServiceCreateData): Promise<Service> {
  const response = await api.post<Service>("/api/services/", data);
  return response.data;
}

export async function updateService(id: string, data: ServiceUpdateData): Promise<Service> {
  const response = await api.patch<Service>(`/api/services/${id}/`, data);
  return response.data;
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/api/services/${id}/`);
}
