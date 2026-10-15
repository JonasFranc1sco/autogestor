import { api } from "./api";
import { LIST_PAGE_SIZE, type Paginated } from "./pagination";

export interface Vehicle {
  id: string;
  owner: {
    id: string;
    name: string;
    document: string;
  };
  license_plate: string;
  year: number | null;
  brand: string;
  model: string;
  color: string;
  chassis: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleCreateData {
  owner_id: string;
  license_plate: string;
  year?: number;
  brand: string;
  model: string;
  color: string;
  chassis: string;
}

export async function getVehicles(): Promise<Vehicle[]> {
  const response = await api.get<Paginated<Vehicle>>("/api/vehicles/", {
    params: { page_size: LIST_PAGE_SIZE },
  });
  return response.data.results;
}

export async function createVehicle(data: VehicleCreateData): Promise<Vehicle> {
  const response = await api.post<Vehicle>("/api/vehicles/", data);
  return response.data;
}
