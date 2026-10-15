import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { refresh, logout as logoutRequest, login as loginRequest } from "@/services/auth.service";
import { getAccessToken, setAccessToken as setStoredAccessToken, subscribeToTokenChange } from "@/services/token.service";
import { api } from "@/services/api";

export interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  email: string;
  workshop?: {
    id: string;
    name: string;
    cnpj?: string | null;
  } | null;
  created_at: string;
  is_active: boolean;
}

interface AuthContextData {
  accessToken: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(getAccessToken());
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  const fetchProfile = useCallback(async () => {
    const response = await api.get<UserProfile>("/api/profile/");
    setUser(response.data);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest({ email, password });
    setStoredAccessToken(response.access);
    await fetchProfile();
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // cookie pode já estar inválido; a sessão local é limpa de qualquer forma
    }
    setStoredAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    return subscribeToTokenChange((token) => {
      setAccessTokenState(token);
      if (!token) {
        setUser(null);
      }
    });
  }, []);

  useEffect(() => {
    async function restoreSession() {
      try {
        const response = await refresh();
        setStoredAccessToken(response.access);
        await fetchProfile();
      } catch {
        setStoredAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ accessToken, user, isLoading, login, logout, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de AuthProvider");
  }
  return context;
}
