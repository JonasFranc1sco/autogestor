import { api } from "./api";
import { type PaymentMethod } from "./serviceOrder.service";

export interface CashRegisterData {
  date: string;
  methods: {
    method: PaymentMethod;
    label: string;
    total: string;
  }[];
  total: string;
  payments_count: number;
}

export async function getCashRegister(date?: string): Promise<CashRegisterData> {
  const response = await api.get<CashRegisterData>("/api/cash-register/", {
    params: date ? { date } : {},
  });
  return response.data;
}
