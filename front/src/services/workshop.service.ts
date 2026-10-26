import { api } from "./api";
import { type AddressCreateData } from "./client.service";

export interface Workshop {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  logo_url?: string | null;
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

export async function uploadWorkshopLogo(file: File): Promise<Workshop> {
  const formData = new FormData();
  formData.append("logo", file);
  const response = await api.post<Workshop>("/api/workshop/logo/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteWorkshopLogo(): Promise<Workshop> {
  const response = await api.delete<Workshop>("/api/workshop/logo/");
  return response.data;
}
