import { api } from "./api";

export interface CepData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function getCep(cep: string): Promise<CepData> {
  const response = await api.get<CepData>("/api/utils/cep/", { params: { cep } });
  return response.data;
}
