import { api } from "./api";

export interface ServiceOrder {
  id: string;
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
  total_price?: string;
}

export async function getServiceOrders(): Promise<ServiceOrder[]> {
  const response = await api.get<ServiceOrder[]>("/api/service-orders/");
  return response.data;
}

export async function createServiceOrder(data: ServiceOrderCreateData): Promise<ServiceOrder> {
  const response = await api.post<ServiceOrder>("/api/service-orders/", data);
  return response.data;
}
