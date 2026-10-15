import { api } from "./api";
import { LIST_PAGE_SIZE, type Paginated } from "./pagination";

export type ServiceOrderStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_PARTS"
  | "WAITING_CLIENT"
  | "DONE"
  | "CANCELLED";

export const STATUS_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  OPEN: ["IN_PROGRESS", "WAITING_PARTS", "WAITING_CLIENT", "CANCELLED"],
  IN_PROGRESS: ["WAITING_PARTS", "WAITING_CLIENT", "DONE", "CANCELLED"],
  WAITING_PARTS: ["IN_PROGRESS", "CANCELLED"],
  WAITING_CLIENT: ["IN_PROGRESS", "CANCELLED"],
  DONE: [],
  CANCELLED: [],
};

export const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  WAITING_PARTS: "Aguardando peças",
  WAITING_CLIENT: "Aguardando cliente",
  DONE: "Concluída",
  CANCELLED: "Cancelada",
};

export interface ServiceOrderItemService {
  id?: string;
  service?: {
    id: string;
    name: string;
    description?: string | null;
    sale_price?: string;
  };
  service_id?: string | null;
  price: string | number;
  discount?: string | number;
  total_price?: string | number;
}

export interface ServiceOrderItemProduct {
  id?: string;
  product?: {
    id: string;
    name: string;
    reference_code?: string | null;
    brand?: string | null;
    sale_price?: string;
  };
  product_id?: string;
  quantity: number;
  price: string | number;
  discount?: string | number;
  total_price?: string | number;
}

export interface ServiceOrder {
  id: string;
  number: number;
  client: {
    id: string;
    name: string;
    document: string | null;
  };
  vehicle: {
    id: string;
    license_plate: string | null;
    brand: string;
    model: string;
  };
  mechanic: {
    id: string;
    name: string;
  } | null;
  status: ServiceOrderStatus;
  description: string | null;
  observations: string | null;
  total_price: string;
  services?: ServiceOrderItemService[];
  products?: ServiceOrderItemProduct[];
  created_at: string;
  updated_at: string;
  opened_at?: string;
  closed_at?: string | null;
}

export interface ServiceOrderCreateData {
  client_id: string;
  vehicle_id: string;
  mechanic_id?: string | null;
  description?: string;
  observations?: string;
  services?: {
    service_id?: string | null;
    service_name?: string;
    price: number | string;
    discount?: number | string;
  }[];
  products?: {
    product_id: string;
    quantity: number;
    price: number | string;
    discount?: number | string;
  }[];
}

export type ServiceOrderUpdateData = Partial<ServiceOrderCreateData>;

export async function getServiceOrders(search?: string, status?: string): Promise<ServiceOrder[]> {
  const response = await api.get<Paginated<ServiceOrder>>("/api/service-orders/", {
    params: {
      page_size: LIST_PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    },
  });
  return response.data.results;
}

export async function getServiceOrder(id: string): Promise<ServiceOrder> {
  const response = await api.get<ServiceOrder>(`/api/service-orders/${id}/`);
  return response.data;
}

export async function createServiceOrder(data: ServiceOrderCreateData): Promise<ServiceOrder> {
  const response = await api.post<ServiceOrder>("/api/service-orders/", data);
  return response.data;
}

export async function updateServiceOrder(id: string, data: ServiceOrderUpdateData): Promise<ServiceOrder> {
  const response = await api.patch<ServiceOrder>(`/api/service-orders/${id}/`, data);
  return response.data;
}

export async function changeServiceOrderStatus(id: string, status: ServiceOrderStatus): Promise<ServiceOrder> {
  const response = await api.post<ServiceOrder>(`/api/service-orders/${id}/change-status/`, { status });
  return response.data;
}
