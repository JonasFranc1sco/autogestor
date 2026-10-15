import { api } from "./api";

export interface DashboardData {
  counts: {
    open_service_orders: number;
    in_progress_service_orders: number;
    done_this_month: number;
    clients: number;
    vehicles: number;
  };
  revenue_this_month: string;
  recent_service_orders: {
    id: string;
    number: number;
    client_name: string;
    vehicle_plate: string | null;
    status: string;
    total_price: string;
    created_at: string;
  }[];
  low_stock_products: {
    id: string;
    name: string;
    stock_quantity: number;
    min_stock_quantity: number | null;
  }[];
}

export async function getDashboard(): Promise<DashboardData> {
  const response = await api.get<DashboardData>("/api/dashboard/");
  return response.data;
}
