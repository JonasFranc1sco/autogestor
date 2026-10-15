import { api } from "./api";
import { LIST_PAGE_SIZE, type Paginated } from "./pagination";

export interface ServiceOrderItemService {
  id?: string;
  service?: {
    id: string;
    name: string;
    description?: string;
  };
  service_id?: string | null;
  service_name?: string;
  price: string | number;
  discount?: string | number;
  total_price?: string | number;
}

export interface ServiceOrderItemProduct {
  id?: string;
  product?: {
    id: string;
    name: string;
    reference_code?: string;
    brand?: string;
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
    document: string;
  };
  vehicle: {
    id: string;
    license_plate: string;
    brand: string;
    model: string;
  };
  mechanic: {
    id: string;
    name: string;
  } | null;
  status: "OPEN" | "IN_PROGRESS" | "WAITING_PARTS" | "WAITING_CLIENT" | "DONE" | "CANCELLED";
  description: string | null;
  observations: string | null;
  total_price: string;
  services?: ServiceOrderItemService[];
  products?: ServiceOrderItemProduct[];
  created_at: string;
  updated_at: string;
}

export interface ServiceOrderCreateData {
  client_id: string;
  vehicle_id: string;
  mechanic_id?: string | null;
  status?: string;
  description?: string;
  observations?: string;
  total_price?: string | number;
  services?: {
    service_id?: string | null;
    service_name: string;
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

export async function getServiceOrders(): Promise<ServiceOrder[]> {
  const response = await api.get<Paginated<ServiceOrder>>("/api/service-orders/", {
    params: { page_size: LIST_PAGE_SIZE },
  });
  return response.data.results;
}

export async function createServiceOrder(data: ServiceOrderCreateData): Promise<ServiceOrder> {
  const response = await api.post<ServiceOrder>("/api/service-orders/", data);
  return response.data;
}
