import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { refresh } from "@/services/auth.service";
import { getAccessToken, setAccessToken as setStoredAccessToken, subscribeToTokenChange } from "@/services/token.service";
import { api } from "@/services/api";

export interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  email: string;
  created_at: string;
  is_active: boolean;
}

interface AuthContextData {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  user: UserProfile | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(getAccessToken());
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  function setAccessToken(token: string | null) {
    setStoredAccessToken(token);
  }

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get<UserProfile>("/api/profile/");
      setUser(response.data);
    } catch {
      setUser(null);
    }
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
        setAccessToken(response.access);
        await fetchProfile();
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, [fetchProfile]);

  function logout() {
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, user, isLoading, logout }}>
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
