import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconBuilding } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";
import { AddressForm, emptyAddress, validateAddress, type AddressFormValues } from "@/components/layout/AddressForm";
import { getWorkshop, updateWorkshop } from "@/services/workshop.service";
import { maskCpfCnpj, maskPhone, toLocalPhoneDigits, unmask } from "@/lib/masks";
import { extractApiErrorMessage } from "@/lib/errors";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<AddressFormValues>({ ...emptyAddress });
  const [hasAddress, setHasAddress] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getWorkshop()
      .then((workshop) => {
        setName(workshop.name);
        setCnpj(workshop.cnpj ?? "");
        setPhone(toLocalPhoneDigits(workshop.phone ?? ""));
        setEmail(workshop.email ?? "");
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

  async function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Informe o nome da oficina.";
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
        phone: phone ? `+55${unmask(phone)}` : null,
        email: email.trim() || null,
        address: hasAnyAddress ? { ...address, complement: address.complement || "" } : null,
      });
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
            value={maskCpfCnpj(cnpj)}
            onChange={(e) => setCnpj(e.target.value)}
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
