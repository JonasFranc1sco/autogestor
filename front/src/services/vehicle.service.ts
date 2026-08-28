import { api } from "./api";

export interface Vehicle {
  id: string;
  owner: {
    id: string;
    name: string;
    document: string;
  };
  license_plate: string;
  brand: string;
  model: string;
  color: string;
  chassis: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleCreateData {
  owner: string;
  license_plate: string;
  brand: string;
  model: string;
  color: string;
  chassis: string;
}

export async function getVehicles(): Promise<Vehicle[]> {
  const response = await api.get<Vehicle[]>("/api/vehicles/");
  return response.data;
}

export async function createVehicle(data: VehicleCreateData): Promise<Vehicle> {
  const response = await api.post<Vehicle>("/api/vehicles/", data);
  return response.data;
}
