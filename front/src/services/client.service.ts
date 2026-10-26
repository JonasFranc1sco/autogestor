import { api } from "./api";
import { DEFAULT_PAGE_SIZE, LIST_PAGE_SIZE, type Paginated } from "./pagination";

export interface Address {
  id: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string | null;
}

export interface Client {
  id: string;
  person_type: "PF" | "PJ";
  name: string;
  phone: string | null;
  email: string | null;
  address: Address | null;
  document: string | null;
  responsible: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddressCreateData {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string;
}

export interface ClientCreateData {
  person_type: "PF" | "PJ";
  name: string;
  phone?: string | null;
  email?: string | null;
  document?: string | null;
  responsible?: string | null;
  address?: AddressCreateData | null;
}

export type ClientUpdateData = Partial<ClientCreateData>;

export async function getClients(search?: string): Promise<Client[]> {
  const response = await api.get<Paginated<Client>>("/api/clients/", {
    params: { page_size: LIST_PAGE_SIZE, ...(search ? { search } : {}) },
  });
  return response.data.results;
}

export async function getClientsPaginated(params?: {
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<Paginated<Client>> {
  const response = await api.get<Paginated<Client>>("/api/clients/", {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? DEFAULT_PAGE_SIZE,
      ...(params?.search ? { search: params.search } : {}),
    },
  });
  return response.data;
}

export async function getClient(id: string): Promise<Client> {
  const response = await api.get<Client>(`/api/clients/${id}/`);
  return response.data;
}

export async function createClient(data: ClientCreateData): Promise<Client> {
  const response = await api.post<Client>("/api/clients/", data);
  return response.data;
}

export async function updateClient(id: string, data: ClientUpdateData): Promise<Client> {
  const response = await api.patch<Client>(`/api/clients/${id}/`, data);
  return response.data;
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/api/clients/${id}/`);
}
