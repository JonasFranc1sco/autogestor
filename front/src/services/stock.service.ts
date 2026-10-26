import { api } from "./api";
import { DEFAULT_PAGE_SIZE, LIST_PAGE_SIZE, type Paginated } from "./pagination";

export type MovementType = "IN" | "OUT" | "ADJUST";

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  IN: "Entrada",
  OUT: "Saída",
  ADJUST: "Ajuste",
};

export interface StockMovement {
  id: string;
  product: string;
  product_name: string;
  movement_type: MovementType;
  quantity: number;
  reason: string;
  service_order: string | null;
  created_by: string | null;
  created_by_name: string | null;
  stock_after: number;
  created_at: string;
}

export interface StockMovementCreateData {
  product: string;
  movement_type: MovementType;
  quantity: number;
  reason: string;
}

export async function getStockMovements(filters?: {
  product?: string;
  movement_type?: string;
}): Promise<StockMovement[]> {
  const response = await api.get<Paginated<StockMovement>>("/api/stock-movements/", {
    params: { page_size: LIST_PAGE_SIZE, ...filters },
  });
  return response.data.results;
}

export async function getStockMovementsPaginated(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  product?: string;
  movement_type?: string;
}): Promise<Paginated<StockMovement>> {
  const response = await api.get<Paginated<StockMovement>>("/api/stock-movements/", {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? DEFAULT_PAGE_SIZE,
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.product ? { product: params.product } : {}),
      ...(params?.movement_type ? { movement_type: params.movement_type } : {}),
    },
  });
  return response.data;
}

export async function createStockMovement(data: StockMovementCreateData): Promise<StockMovement> {
  const response = await api.post<StockMovement>("/api/stock-movements/", data);
  return response.data;
}
