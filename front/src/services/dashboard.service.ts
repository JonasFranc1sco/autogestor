import {api} from "@/services/api"

export async function getDashboard() {
    const response = await api.get("/dashboard/");
    return response.data;
}