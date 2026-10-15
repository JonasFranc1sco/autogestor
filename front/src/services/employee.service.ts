import { api } from "./api";
import { LIST_PAGE_SIZE, type Paginated } from "./pagination";
import { type AddressCreateData, type Address } from "./client.service";

export interface Employee {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: Address | null;
  document_cpf: string | null;
  document_rg: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreateData {
  name: string;
  phone?: string | null;
  email?: string | null;
  document_cpf?: string | null;
  document_rg?: string | null;
  address?: AddressCreateData | null;
}

export type EmployeeUpdateData = Partial<EmployeeCreateData>;

export async function getEmployees(search?: string): Promise<Employee[]> {
  const response = await api.get<Paginated<Employee>>("/api/employees/", {
    params: { page_size: LIST_PAGE_SIZE, ...(search ? { search } : {}) },
  });
  return response.data.results;
}

export async function createEmployee(data: EmployeeCreateData): Promise<Employee> {
  const response = await api.post<Employee>("/api/employees/", data);
  return response.data;
}

export async function updateEmployee(id: string, data: EmployeeUpdateData): Promise<Employee> {
  const response = await api.patch<Employee>(`/api/employees/${id}/`, data);
  return response.data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/api/employees/${id}/`);
}
