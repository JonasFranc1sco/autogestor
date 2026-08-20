import axios, { AxiosError, type InternalAxiosRequestConfig, } from "axios";
import { getAccessToken, setAccessToken } from "@/services/token.service"

interface RetryableRequestConfig
    extends InternalAxiosRequestConfig {
        _retry?: boolean;
    }

export const api = axios.create({
    baseURL: "http://localhost:8000",
    withCredentials: true,
});

export const authApi = axios.create({
    baseURL: "http://localhost:8000",
    withCredentials: true,
})

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
    if (!refreshPromise) {
        refreshPromise = authApi
        .post("/api/auth/refresh/")
        .then((response) => {
            const newAccessToken = response.data.access;

            setAccessToken(newAccessToken);

            return newAccessToken;
        })
        .finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const accessToken = getAccessToken();

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
        const originalRequest =
        error.config as RetryableRequestConfig | undefined;
        
        if (!originalRequest) {
            return Promise.reject(error);
        }

        if (error.response?.status !== 401) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const newAccessToken = await refreshAccessToken();

            originalRequest.headers.Authorization =
            `Bearer ${newAccessToken}`;

            return api(originalRequest);
        } catch (refreshError) {
            setAccessToken(null);

            return Promise.reject(refreshError);
        }
    }
);