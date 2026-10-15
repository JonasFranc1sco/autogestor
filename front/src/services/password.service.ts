import { authApi, api } from "./api";

export async function requestPasswordReset(email: string): Promise<void> {
  await authApi.post("/api/auth/password-reset/", { email });
}

export async function confirmPasswordReset(data: {
  uid: string;
  token: string;
  new_password: string;
}): Promise<void> {
  await authApi.post("/api/auth/password-reset/confirm/", data);
}

export async function changePassword(data: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<void> {
  await api.post("/api/profile/change-password/", data);
}

export async function updateProfile(fullName: string): Promise<void> {
  await api.patch("/api/profile/", { full_name: fullName });
}
