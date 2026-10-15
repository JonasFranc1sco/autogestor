import { api } from "./api";
import { LIST_PAGE_SIZE, type Paginated } from "./pagination";

export type UserRole = "ADMIN" | "MANAGER" | "MECHANIC" | "ATTENDANT";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  MECHANIC: "Mecânico",
  ATTENDANT: "Atendente",
};

export interface User {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  is_active: boolean;
}

export interface UserCreateData {
  full_name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export async function getUsers(): Promise<User[]> {
  const response = await api.get<Paginated<User>>("/api/users/", {
    params: { page_size: LIST_PAGE_SIZE },
  });
  return response.data.results;
}

export async function createUser(data: UserCreateData): Promise<User> {
  const response = await api.post<User>("/api/users/", data);
  return response.data;
}

export async function updateUser(id: string, data: { full_name?: string; role?: UserRole }): Promise<User> {
  const response = await api.patch<User>(`/api/users/${id}/`, data);
  return response.data;
}

export async function deactivateUser(id: string): Promise<void> {
  await api.delete(`/api/users/${id}/`);
}
