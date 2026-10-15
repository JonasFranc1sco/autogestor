import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconPencil, IconUserOff } from "@tabler/icons-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Dialog } from "@/components/layout/Dialog";
import { FormField, FormSelect } from "@/components/ui/form";
import {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
  USER_ROLE_LABELS,
  type User,
  type UserRole,
} from "@/services/user.service";
import { extractApiErrorMessage, extractFieldErrors } from "@/lib/errors";
import { useAuth } from "@/contexts/AuthContext";

interface FormValues {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
}

const emptyForm: FormValues = {
  full_name: "",
  email: "",
  password: "",
  role: "ATTENDANT",
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await getUsers());
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível carregar os usuários."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = users.filter((user) =>
    search
      ? user.full_name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setDialogOpen(true);
  }

  function openEdit(user: User) {
    setEditingId(user.id);
    setForm({
      full_name: user.full_name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setFieldErrors({});
    setDialogOpen(true);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.full_name.trim()) errors.full_name = "Informe o nome.";
    if (!editingId && !form.email.trim()) errors.email = "Informe o e-mail.";
    if (!editingId && form.password.length < 8) errors.password = "A senha deve ter pelo menos 8 caracteres.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateUser(editingId, { full_name: form.full_name.trim(), role: form.role });
        toast.success("Usuário atualizado com sucesso.");
      } else {
        await createUser({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        });
        toast.success("Usuário criado com sucesso.");
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      setFieldErrors(extractFieldErrors(error));
      toast.error(extractApiErrorMessage(error, "Não foi possível salvar o usuário."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await deactivateUser(deactivateTarget.id);
      toast.success("Usuário desativado com sucesso.");
      setDeactivateTarget(null);
      await load();
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível desativar o usuário."));
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <PageLayout
      title="Usuários"
      searchPlaceholder="Buscar por nome ou e-mail..."
      searchValue={search}
      onSearchChange={setSearch}
      onAdd={openCreate}
      addLabel="Novo Usuário"
    >
      {!isAdmin && (
        <p className="mb-4 rounded-lg bg-status-waiting/10 px-4 py-2 text-sm text-status-waiting">
          Apenas administradores podem criar, editar papéis e desativar usuários.
        </p>
      )}
      <div className="rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <IconLoader2 size={18} className="animate-spin" /> Carregando usuários...
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {search ? "Nenhum usuário encontrado para esta busca." : "Nenhum usuário cadastrado ainda."}
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3 max-md:hidden">Papel</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground md:hidden">
                        {USER_ROLE_LABELS[user.role]}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3 max-md:hidden">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {USER_ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(user)}
                              aria-label={`Editar ${user.full_name}`}
                              title="Editar"
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            >
                              <IconPencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeactivateTarget(user)}
                              aria-label={`Desativar ${user.full_name}`}
                              title="Desativar"
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <IconUserOff size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {filtered.length} usuário(s) exibido(s)
            </p>
          </>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? "Editar Usuário" : "Novo Usuário"}
        onSubmit={() => void handleSubmit()}
        submitLabel={editingId ? "Salvar alterações" : "Criar usuário"}
        loading={saving}
        maxWidth="max-w-lg"
      >
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Nome"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Nome completo"
            error={fieldErrors.full_name}
          />

          <FormField
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={Boolean(editingId)}
            placeholder="usuario@email.com"
            error={fieldErrors.email}
          />

          {!editingId && (
            <FormField
              label="Senha"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo de 8 caracteres"
              error={fieldErrors.password}
            />
          )}

          <FormSelect
            label="Papel"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            error={fieldErrors.role}
          >
            {(Object.keys(USER_ROLE_LABELS) as UserRole[]).map((role) => (
              <option key={role} value={role}>
                {USER_ROLE_LABELS[role]}
              </option>
            ))}
          </FormSelect>
        </div>
      </Dialog>

      <Dialog
        open={deactivateTarget !== null}
        onClose={() => setDeactivateTarget(null)}
        title="Desativar usuário"
        onSubmit={() => void handleDeactivate()}
        submitLabel="Desativar"
        loading={deactivating}
        destructive
        maxWidth="max-w-md"
      >
        <p className="text-sm">
          Tem certeza que deseja desativar <strong>{deactivateTarget?.full_name}</strong>? O usuário
          não poderá mais acessar o sistema.
        </p>
      </Dialog>
    </PageLayout>
  );
}
