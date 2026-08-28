import { api } from "./api";

export interface Product {
  id: string;
  name: string;
  reference_code: string;
  barcode: string | null;
  description: string | null;
  supplier: string;
  brand: string;
  cost_price: string;
  margin_percentage: string;
  sale_price: string;
  stock_quantity: number;
  min_stock_quantity: number;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCreateData {
  name: string;
  reference_code: string;
  barcode?: string;
  description?: string;
  supplier: string;
  brand: string;
  cost_price: string;
  margin_percentage: string;
  sale_price: string;
  stock_quantity: number;
  min_stock_quantity?: number;
  location?: string;
}

export async function getProducts(): Promise<Product[]> {
  const response = await api.get<Product[]>("/api/products/");
  return response.data;
}

export async function createProduct(data: ProductCreateData): Promise<Product> {
  const response = await api.post<Product>("/api/products/", data);
  return response.data;
}
