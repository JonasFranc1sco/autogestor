import { api } from "./api";

export interface ReportsData {
  period: { date_from: string; date_to: string };
  summary: {
    orders: number;
    done_orders: number;
    cancelled_orders: number;
    revenue_done: string;
    received: string;
  };
  top_services: { name: string; quantity: number; total: string }[];
  top_products: { name: string; quantity: number; total: string }[];
  mechanic_productivity: { mechanic: string; orders: number; revenue: string }[];
  payments_by_method: { method: string; total: string }[];
}

export async function getReports(dateFrom?: string, dateTo?: string): Promise<ReportsData> {
  const response = await api.get<ReportsData>("/api/reports/", {
    params: {
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
    },
  });
  return response.data;
}
