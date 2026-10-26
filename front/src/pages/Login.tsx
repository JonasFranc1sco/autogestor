import { useEffect, useState } from "react";
import type React from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconCar, IconMail, IconLock, IconLoader2 } from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import { extractApiErrorMessage } from "@/lib/errors";

export default function Login() {
  const { login, accessToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (accessToken) {
      navigate("/", { replace: true });
    }
  }, [accessToken, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      const status = err && typeof err === "object" && "response" in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
      setError(
        status === 400
          ? "Email ou senha inválidos."
          : extractApiErrorMessage(err),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3">
          <IconCar
            size={40}
            className="text-primary animate-logo-pulse"
            stroke={1.8}
          />

          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-wide">
              AUTO<span className="text-primary">GESTOR</span>
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Entre na sua conta para continuar
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-border bg-surface p-8"
        >
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <IconMail size={14} className="text-muted-foreground" />
              E-mail
            </label>

            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <IconLock size={14} className="text-muted-foreground" />
              Senha
            </label>

            <input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <IconLoader2 size={16} className="animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <p className="text-center text-sm">
          <Link to="/recuperar-senha" className="text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          Sistema de gestão para oficinas mecânicas
        </p>
      </div>
    </main>
  );
}
