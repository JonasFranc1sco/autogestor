import { api } from "./api";
import { LIST_PAGE_SIZE, type Paginated } from "./pagination";
import { type AddressCreateData } from "./client.service";

export interface Employee {
  id: string;
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
  document_cpf: string;
  document_rg: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreateData {
  name: string;
  phone: string;
  email: string;
  document_cpf: string;
  document_rg: string;
  address: AddressCreateData;
}

export async function getEmployees(): Promise<Employee[]> {
  const response = await api.get<Paginated<Employee>>("/api/employees/", {
    params: { page_size: LIST_PAGE_SIZE },
  });
  return response.data.results;
}

export async function createEmployee(data: EmployeeCreateData): Promise<Employee> {
  const response = await api.post<Employee>("/api/employees/", data);
  return response.data;
}
