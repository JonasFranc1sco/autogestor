import axios from "axios";

export function extractApiErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado."): string {
  if (!axios.isAxiosError(error)) return fallback;

  const status = error.response?.status;
  const data = error.response?.data as Record<string, unknown> | undefined;

  if (!error.response) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão.";
  }

  if (status === 401) {
    return "Sessão expirada. Entre novamente.";
  }

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (data && typeof data === "object") {
    const messages = Object.entries(data)
      .map(([, value]) => {
        const list = Array.isArray(value) ? value : [value];
        return list.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join(" ");
      })
      .filter(Boolean);
    if (messages.length > 0) return messages.join(" ");
  }

  return fallback;
}

export function extractFieldErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!axios.isAxiosError(error) || !error.response?.data) return result;

  const data = error.response.data as Record<string, unknown>;
  for (const [field, value] of Object.entries(data)) {
    const list = Array.isArray(value) ? value : [value];
    const message = list.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join(" ");
    if (message) result[field] = message;
  }
  return result;
}
