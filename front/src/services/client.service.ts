import { api } from "./api";
import { LIST_PAGE_SIZE, type Paginated } from "./pagination";

export interface Client {
  id: string;
  person_type: "PF" | "PJ";
  name: string;
  phone: string;
  email: string;
  address: {
    id: string;
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    complement: string;
  };
  document: string;
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
  complement: string;
}

export interface ClientCreateData {
  person_type: "PF" | "PJ";
  name: string;
  phone: string;
  email: string;
  document: string;
  responsible?: string;
  address: AddressCreateData;
}

export async function getClients(): Promise<Client[]> {
  const response = await api.get<Paginated<Client>>("/api/clients/", {
    params: { page_size: LIST_PAGE_SIZE },
  });
  return response.data.results;
}

export async function createClient(data: ClientCreateData): Promise<Client> {
  const response = await api.post<Client>("/api/clients/", data);
  return response.data;
}
