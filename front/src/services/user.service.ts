import { api } from "./api";
import { DEFAULT_PAGE_SIZE, LIST_PAGE_SIZE, type Paginated } from "./pagination";

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

export async function getUsers(search?: string): Promise<User[]> {
  const response = await api.get<Paginated<User>>("/api/users/", {
    params: { page_size: LIST_PAGE_SIZE, ...(search ? { search } : {}) },
  });
  return response.data.results;
}

export async function getUsersPaginated(params?: {
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<Paginated<User>> {
  const response = await api.get<Paginated<User>>("/api/users/", {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? DEFAULT_PAGE_SIZE,
      ...(params?.search ? { search: params.search } : {}),
    },
  });
  return response.data;
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
