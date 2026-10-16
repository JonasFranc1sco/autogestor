import { api } from "./api";
import { LIST_PAGE_SIZE, type Paginated } from "./pagination";

export interface Vehicle {
  id: string;
  owner: {
    id: string;
    name: string;
    document: string | null;
  };
  license_plate: string | null;
  year: number | null;
  brand: string;
  model: string;
  color: string | null;
  chassis: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleCreateData {
  owner_id: string;
  license_plate?: string | null;
  year?: number | null;
  brand: string;
  model: string;
  color?: string | null;
  chassis?: string | null;
}

export type VehicleUpdateData = Partial<VehicleCreateData>;

export async function getVehicles(search?: string, ownerId?: string): Promise<Vehicle[]> {
  const response = await api.get<Paginated<Vehicle>>("/api/vehicles/", {
    params: {
      page_size: LIST_PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(ownerId ? { owner: ownerId } : {}),
    },
  });
  return response.data.results;
}

export async function createVehicle(data: VehicleCreateData): Promise<Vehicle> {
  const response = await api.post<Vehicle>("/api/vehicles/", data);
  return response.data;
}

export async function updateVehicle(id: string, data: VehicleUpdateData): Promise<Vehicle> {
  const response = await api.patch<Vehicle>(`/api/vehicles/${id}/`, data);
  return response.data;
}

export async function deleteVehicle(id: string): Promise<void> {
  await api.delete(`/api/vehicles/${id}/`);
}
