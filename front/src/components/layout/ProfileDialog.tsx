import { useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/layout/Dialog";
import { FormField } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { changePassword, updateProfile } from "@/services/password.service";
import { extractApiErrorMessage } from "@/lib/errors";

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileDialog({ open, onClose }: ProfileDialogProps) {
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) nextErrors.fullName = "Informe o nome.";
    if (newPassword) {
      if (newPassword.length < 8) nextErrors.newPassword = "A senha deve ter pelo menos 8 caracteres.";
      if (newPassword !== confirmPassword) nextErrors.confirmPassword = "As senhas não conferem.";
      if (!currentPassword) nextErrors.currentPassword = "Informe a senha atual.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      if (fullName.trim() !== user?.full_name) {
        await updateProfile(fullName.trim());
        await refreshProfile();
      }
      if (newPassword) {
        await changePassword({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        });
      }
      toast.success("Perfil atualizado com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível atualizar o perfil."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Meu perfil"
      onSubmit={() => void handleSave()}
      submitLabel="Salvar"
      loading={saving}
      maxWidth="max-w-md"
    >
      <div className="grid grid-cols-1 gap-4">
        <FormField
          label="Nome"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
        />
        <FormField
          label="E-mail"
          value={user?.email ?? ""}
          disabled
        />
        <p className="text-xs text-muted-foreground">
          Papel: <span className="font-medium">{user?.role}</span>
        </p>

        <hr className="border-border/50" />

        <FormField
          label="Senha atual"
          type="password"
          optional
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={errors.currentPassword}
        />
        <FormField
          label="Nova senha"
          type="password"
          optional
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={errors.newPassword}
        />
        <FormField
          label="Confirmar nova senha"
          type="password"
          optional
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />
      </div>
    </Dialog>
  );
}
