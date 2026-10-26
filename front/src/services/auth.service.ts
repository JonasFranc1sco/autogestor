import { authApi, api } from "@/services/api";

interface LoginData {
    email: string;
    password: string;
}

export async function login(data: LoginData) {
    const response = await authApi.post<{ access: string }>("/api/auth/login/", data);
    return response.data;
}

let refreshInFlight: Promise<{ access: string }> | null = null;

export async function refresh() {
    // Single-flight: chamadas concorrentes (ex.: StrictMode) compartilham a mesma
    // requisição, evitando corrida na rotação do refresh token.
    if (!refreshInFlight) {
        refreshInFlight = authApi
            .post<{ access: string }>("/api/auth/refresh/")
            .then((response) => response.data)
            .finally(() => {
                refreshInFlight = null;
            });
    }
    return refreshInFlight;
}

export async function logout() {
    await api.post("/api/auth/logout/");
}
