import { api } from "./api";
import { DEFAULT_PAGE_SIZE, LIST_PAGE_SIZE, type Paginated } from "./pagination";

export interface Product {
  id: string;
  name: string;
  reference_code: string | null;
  barcode: string | null;
  description: string | null;
  application?: string | null;
  supplier: string | null;
  brand: string | null;
  cost_price?: string;
  margin_percentage?: string;
  sale_price: string;
  stock_quantity: number;
  min_stock_quantity: number | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCreateData {
  name: string;
  reference_code?: string | null;
  barcode?: string | null;
  description?: string | null;
  application?: string | null;
  supplier?: string | null;
  brand?: string | null;
  cost_price: string;
  margin_percentage?: string;
  sale_price: string;
  stock_quantity: number;
  min_stock_quantity?: number | null;
  location?: string | null;
}

export type ProductUpdateData = Omit<Partial<ProductCreateData>, "stock_quantity">;

export async function getProducts(search?: string): Promise<Product[]> {
  const response = await api.get<Paginated<Product>>("/api/products/", {
    params: { page_size: LIST_PAGE_SIZE, ...(search ? { search } : {}) },
  });
  return response.data.results;
}

export async function getProductsPaginated(params?: {
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<Paginated<Product>> {
  const response = await api.get<Paginated<Product>>("/api/products/", {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? DEFAULT_PAGE_SIZE,
      ...(params?.search ? { search: params.search } : {}),
    },
  });
  return response.data;
}

export async function createProduct(data: ProductCreateData): Promise<Product> {
  const response = await api.post<Product>("/api/products/", data);
  return response.data;
}

export async function updateProduct(id: string, data: ProductUpdateData): Promise<Product> {
  const response = await api.patch<Product>(`/api/products/${id}/`, data);
  return response.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/api/products/${id}/`);
}
