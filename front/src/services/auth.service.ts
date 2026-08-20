import { api, authApi } from "@/services/api";

interface LoginData {
    email: string;
    password: string;
}

export async function login(data: LoginData) {
    const response = await authApi.post("/api/auth/login/", data);
    return response.data;
}

export async function refresh() {
    const response = await authApi.post("/api/auth/refresh/");
    return response.data;
}