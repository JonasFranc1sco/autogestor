import { authApi, api, refreshAccessToken } from "@/services/api";

interface LoginData {
    email: string;
    password: string;
}

export async function login(data: LoginData) {
    const response = await authApi.post<{ access: string }>("/api/auth/login/", data);
    return response.data;
}

export async function refresh(): Promise<{ access: string}> {
    // Reutiliza a fila single-flight única de api.ts (refreshAccessToken)
    const access = await refreshAccessToken();
    return { access }
}

export async function logout() {
    await api.post("/api/auth/logout/");
}
