import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconBuilding, IconUpload, IconTrash, IconPhoto } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";
import { AddressForm, emptyAddress, validateAddress, type AddressFormValues } from "@/components/layout/AddressForm";
import {
  getWorkshop,
  updateWorkshop,
  uploadWorkshopLogo,
  deleteWorkshopLogo,
} from "@/services/workshop.service";
import { useAuth } from "@/contexts/AuthContext";
import { maskCnpj, maskPhone, isValidCnpj, isValidPhone, phoneToE164, toLocalPhoneDigits, unmask } from "@/lib/masks";
import { extractApiErrorMessage } from "@/lib/errors";

export default function SettingsPage() {
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [address, setAddress] = useState<AddressFormValues>({ ...emptyAddress });
  const [hasAddress, setHasAddress] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getWorkshop()
      .then((workshop) => {
        setName(workshop.name);
        setCnpj(unmask(workshop.cnpj ?? ""));
        setPhone(toLocalPhoneDigits(workshop.phone ?? ""));
        setEmail(workshop.email ?? "");
        setLogoUrl(workshop.logo_url ?? null);
        if (workshop.address) {
          setHasAddress(true);
          setAddress({
            cep: workshop.address.cep,
            street: workshop.address.street,
            number: workshop.address.number,
            neighborhood: workshop.address.neighborhood,
            city: workshop.address.city,
            state: workshop.address.state,
            complement: workshop.address.complement ?? "",
          });
        }
      })
      .catch((error) => {
        toast.error(extractApiErrorMessage(error, "Não foi possível carregar os dados da oficina."));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogoUpload(file: File | undefined) {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const updated = await uploadWorkshopLogo(file);
      setLogoUrl(updated.logo_url ?? null);
      await refreshProfile();
      toast.success("Logo da oficina atualizada.");
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível enviar a logo."));
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleLogoRemove() {
    setUploadingLogo(true);
    try {
      await deleteWorkshopLogo();
      setLogoUrl(null);
      await refreshProfile();
      toast.success("Logo removida.");
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível remover a logo."));
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Informe o nome da oficina.";
    if (cnpj && !isValidCnpj(cnpj)) nextErrors.cnpj = "Informe um CNPJ válido.";
    if (phone && !isValidPhone(phone)) nextErrors.phone = "Informe o telefone com DDD.";
    const hasAnyAddress = Object.values(address).some((value) => value.trim() !== "");
    if (hasAnyAddress) {
      for (const [key, value] of Object.entries(validateAddress(address))) {
        nextErrors[`address.${key}`] = value;
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await updateWorkshop({
        name: name.trim(),
        cnpj: cnpj ? unmask(cnpj) : null,
        phone: phoneToE164(phone),
        email: email.trim() || null,
        address: hasAnyAddress ? { ...address, complement: address.complement || "" } : null,
      });
      await refreshProfile();
      toast.success("Dados da oficina atualizados.");
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível salvar os dados da oficina."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconLoader2 size={18} className="animate-spin" /> Carregando configurações...
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Dados da oficina usados na impressão de ordens de serviço
        </p>
      </header>

      <section className="max-w-3xl rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <IconBuilding size={18} /> Dados da oficina
        </h2>

        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-background/40 p-4">
          <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background p-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo da oficina"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <IconPhoto size={24} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-48">
            <p className="text-sm font-medium">Logo da oficina</p>
            <p className="text-xs text-muted-foreground">
              Exibida no cabeçalho das Ordens de Serviço impressas (JPG, PNG ou SVG — máx. 5 MB).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
              <IconUpload size={16} />
              {uploadingLogo ? "Enviando..." : logoUrl ? "Alterar logo" : "Enviar logo"}
              <input
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml"
                disabled={uploadingLogo}
                onChange={(e) => {
                  void handleLogoUpload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {logoUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleLogoRemove()}
                disabled={uploadingLogo}
                aria-label="Remover logo"
              >
                <IconTrash size={16} />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Nome da oficina"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <FormField
            label="CNPJ"
            optional
            inputMode="numeric"
            value={maskCnpj(cnpj)}
            onChange={(e) => setCnpj(unmask(e.target.value).slice(0, 14))}
            placeholder="00.000.000/0000-00"
            error={errors.cnpj}
          />
          <FormField
            label="Telefone"
            optional
            value={maskPhone(phone)}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(62) 99999-0000"
            error={errors.phone}
          />
          <FormField
            label="E-mail"
            optional
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contato@oficina.com"
            error={errors.email}
          />
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Endereço</h3>
          <AddressForm
            values={address}
            onChange={setAddress}
            errors={Object.fromEntries(
              Object.entries(errors)
                .filter(([key]) => key.startsWith("address."))
                .map(([key, value]) => [key.replace("address.", ""), value]),
            )}
          />
          {hasAddress && (
            <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={!Object.values(address).some((value) => value.trim() !== "")}
                onChange={(e) => {
                  if (e.target.checked) setAddress({ ...emptyAddress });
                }}
              />
              Limpar endereço
            </label>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => void handleSave()} loading={saving}>
            Salvar configurações
          </Button>
        </div>
      </section>
    </main>
  );
}
