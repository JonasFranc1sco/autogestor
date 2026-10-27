import { api } from "./api";
import { DEFAULT_PAGE_SIZE, LIST_PAGE_SIZE, type Paginated } from "./pagination";
import { type Address } from "./client.service";

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
  mechanic?: {
    id: string;
    name: string;
  } | null;
  mechanic_id?: string | null;
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
  seller?: {
    id: string;
    full_name: string;
    email?: string;
  } | null;
  seller_id?: string | null;
  quantity: number;
  price: string | number;
  discount?: string | number;
  total_price?: string | number;
}

export interface ServiceOrderEvent {
  id: string;
  from_status: string | null;
  to_status: string | null;
  description: string;
  created_by_name: string | null;
  created_at: string;
}

export interface ServiceOrderPayment {
  id: string;
  service_order: string;
  method: PaymentMethod;
  amount: string;
  paid_at: string;
  created_by_name: string | null;
  created_at: string;
}

export type PaymentMethod = "CASH" | "PIX" | "CREDIT" | "DEBIT" | "TRANSFER";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "PIX",
  CREDIT: "Cartão de crédito",
  DEBIT: "Cartão de débito",
  TRANSFER: "Transferência",
};

export interface ServiceOrder {
  id: string;
  number: number;
  client: {
    id: string;
    name: string;
    document: string | null;
    phone?: string | null;
    email?: string | null;
    address?: Address | null;
  };
  vehicle: {
    id: string;
    license_plate: string | null;
    brand: string;
    model: string;
    mileage?: string | null;
  };
  status: ServiceOrderStatus;
  description: string | null;
  observations: string | null;
  total_price: string;
  odometer?: number | null;
  paid_total?: string;
  balance?: string;
  services?: ServiceOrderItemService[];
  products?: ServiceOrderItemProduct[];
  events?: ServiceOrderEvent[];
  payments?: ServiceOrderPayment[];
  created_at: string;
  updated_at: string;
  opened_at?: string;
  closed_at?: string | null;
}

export interface ServiceOrderCreateData {
  client_id: string;
  vehicle_id: string;
  description?: string;
  observations?: string;
  services?: {
    service_id?: string | null;
    service_name?: string;
    mechanic_id?: string | null;
    price: number | string;
    discount?: number | string;
  }[];
  products?: {
    product_id: string;
    seller_id?: string | null;
    quantity: number;
    price: number | string;
    discount?: number | string;
  }[];
}

export type ServiceOrderUpdateData = Partial<ServiceOrderCreateData> & {
  odometer?: number | null;
};

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

export interface ServiceOrderListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  vehicle_brand?:string;
  vehicle_model?:string;
  mechanic?:string;
}

export async function getServiceOrdersPaginated(
  params?: ServiceOrderListParams,
): Promise<Paginated<ServiceOrder>> {
  const response = await api.get<Paginated<ServiceOrder>>("/api/service-orders/", {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? DEFAULT_PAGE_SIZE,
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.vehicle_brand ? {vehicle_brand: params.vehicle_brand} : {}),
      ...(params?.vehicle_model ? {vehicle_model: params.vehicle_model} : {}),
      ...(params?.mechanic ? {mechanic: params.mechanic} : {}),
    },
  });
  return response.data;
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


export async function getServiceOrderPayments(id: string): Promise<ServiceOrderPayment[]> {
  const response = await api.get<ServiceOrderPayment[]>(`/api/service-orders/${id}/payments/`);
  return response.data;
}

export async function registerServiceOrderPayment(
  id: string,
  data: { method: PaymentMethod; amount: string },
): Promise<ServiceOrderPayment> {
  const response = await api.post<ServiceOrderPayment>(`/api/service-orders/${id}/payments/`, data);
  return response.data;
}

export async function refundServiceOrderPayment(id: string, paymentId: string): Promise<void> {
  await api.delete(`/api/service-orders/${id}/payments/${paymentId}/`);
}

export interface ServiceOrderAttachment {
  id: string;
  file: string;
  file_url: string | null;
  description: string | null;
  uploaded_by_name: string | null;
  created_at: string;
}

export async function getServiceOrderAttachments(id: string): Promise<ServiceOrderAttachment[]> {
  const response = await api.get<ServiceOrderAttachment[]>(`/api/service-orders/${id}/attachments/`);
  return response.data;
}

export async function uploadServiceOrderAttachment(
  id: string,
  file: File,
  description?: string,
): Promise<ServiceOrderAttachment> {
  const formData = new FormData();
  formData.append("file", file);
  if (description) formData.append("description", description);
  const response = await api.post<ServiceOrderAttachment>(
    `/api/service-orders/${id}/attachments/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

export async function deleteServiceOrderAttachment(id: string, attachmentId: string): Promise<void> {
  await api.delete(`/api/service-orders/${id}/attachments/${attachmentId}/`);
}

export async function downloadServiceOrderAttachment(
  id: string,
  attachmentId: string,
): Promise<Blob> {
  const response = await api.get<Blob>(
    `/api/service-orders/${id}/attachments/${attachmentId}/download/`,
    { responseType: "blob" },
  );
  return response.data;
}
