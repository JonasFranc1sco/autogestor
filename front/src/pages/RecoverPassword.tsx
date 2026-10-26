import { useEffect, useState } from "react";
import type React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { IconCar, IconLock, IconLoader2, IconMail } from "@tabler/icons-react";
import { requestPasswordReset, confirmPasswordReset } from "@/services/password.service";
import { extractApiErrorMessage } from "@/lib/errors";

export default function RecoverPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const uid = params.get("uid");
  const token = params.get("token");
  const isConfirm = Boolean(uid && token);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isConfirm) return;
  }, [isConfirm]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (isConfirm) {
      if (password.length < 8) {
        setError("A senha deve ter pelo menos 8 caracteres.");
        return;
      }
      if (password !== confirm) {
        setError("As senhas não conferem.");
        return;
      }
      setLoading(true);
      try {
        await confirmPasswordReset({ uid: uid!, token: token!, new_password: password });
        toast.success("Senha redefinida com sucesso. Entre com a nova senha.");
        navigate("/login", { replace: true });
      } catch (err) {
        setError(extractApiErrorMessage(err, "Não foi possível redefinir a senha."));
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Não foi possível solicitar a recuperação."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3">
          <IconCar size={40} className="text-primary animate-logo-pulse" stroke={1.8} />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-wide">
              AUTO<span className="text-primary">GESTOR</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isConfirm ? "Defina sua nova senha" : "Recuperação de senha"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-surface p-8">
          {!isConfirm ? (
            sent ? (
              <p className="rounded-lg bg-status-done/10 px-4 py-3 text-sm text-status-done">
                Se o e-mail existir, o link de recuperação foi enviado. Verifique sua caixa de entrada.
              </p>
            ) : (
              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
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
            )
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                  <IconLock size={14} className="text-muted-foreground" />
                  Nova senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm" className="flex items-center gap-2 text-sm font-medium">
                  <IconLock size={14} className="text-muted-foreground" />
                  Confirmar nova senha
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {!sent && (
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <IconLoader2 size={16} className="animate-spin" />
                  Processando...
                </>
              ) : isConfirm ? (
                "Redefinir senha"
              ) : (
                "Enviar link de recuperação"
              )}
            </button>
          )}
        </form>

        <p className="text-center text-sm">
          <Link to="/login" className="text-primary hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </main>
  );
}
