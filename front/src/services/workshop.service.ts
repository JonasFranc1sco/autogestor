import { api } from "./api";
import { type AddressCreateData } from "./client.service";

export interface Workshop {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: {
    id: string;
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    complement: string | null;
  } | null;
}

export interface WorkshopUpdateData {
  name?: string;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: AddressCreateData | null;
}

export async function getWorkshop(): Promise<Workshop> {
  const response = await api.get<Workshop>("/api/workshop/");
  return response.data;
}

export async function updateWorkshop(data: WorkshopUpdateData): Promise<Workshop> {
  const response = await api.patch<Workshop>("/api/workshop/", data);
  return response.data;
}
