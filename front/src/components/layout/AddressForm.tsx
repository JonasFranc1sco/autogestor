import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { maskCep, unmask } from "@/lib/masks";
import { getCep } from "@/services/lookup.service";
import axios from "axios";
import { FormField } from "@/components/ui/form";

export interface AddressFormValues {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
}

export const emptyAddress: AddressFormValues = {
  cep: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  complement: "",
};

interface AddressFormProps {
  values: AddressFormValues;
  onChange: (values: AddressFormValues) => void;
  errors?: Partial<Record<keyof AddressFormValues, string>>;
}

export function AddressForm({ values, onChange, errors = {} }: AddressFormProps) {
  const [cepLoading, setCepLoading] = useState(false);
  const cepRequestRef = useRef(0);
  const lastCepFetched = useRef("");
  const firstRunRef = useRef(true);

  function set<K extends keyof AddressFormValues>(key: K, value: string) {
    onChange({ ...values, [key]: value });
  }

  // Mantém os valores atuais sem recriar a função de busca a cada tecla.
  const valuesRef = useRef(values);
  valuesRef.current = values;

  // Auto-preenche o endereço quando o CEP completo é digitado.
  const lookupCep = useCallback(
    async (cepDigits: string) => {
      const requestId = ++cepRequestRef.current;
      setCepLoading(true);
      try {
        const data = await getCep(cepDigits);
        if (requestId !== cepRequestRef.current) return;
        onChange({
          ...valuesRef.current,
          cep: cepDigits,
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
        });
        toast.success("Endereço preenchido pelo CEP.");
      } catch (error) {
        if (requestId !== cepRequestRef.current) return;
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (status === 404) {
          toast.error("CEP não encontrado.");
        } else {
          toast.error("Não foi possível consultar o CEP. Preencha o endereço manualmente.");
        }
      } finally {
        if (requestId === cepRequestRef.current) setCepLoading(false);
      }
    },
    [onChange],
  );

  useEffect(() => {
    const digits = values.cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      lastCepFetched.current = "";
      return;
    }
    if (lastCepFetched.current === digits) return;

    // Não sobrescreve um endereço já preenchido (ex.: edição de cadastro).
    if (firstRunRef.current && valuesRef.current.street.trim()) {
      firstRunRef.current = false;
      lastCepFetched.current = digits;
      return;
    }
    firstRunRef.current = false;

    lastCepFetched.current = digits;
    void lookupCep(digits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.cep]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField
        label="CEP"
        value={maskCep(values.cep)}
        onChange={(e) => set("cep", unmask(e.target.value))}
        placeholder="01310-100"
        error={errors.cep}
        maxLength={9}
        aria-busy={cepLoading}
      />
      <FormField
        label="Rua"
        value={values.street}
        onChange={(e) => set("street", e.target.value)}
        placeholder="Nome da rua"
        error={errors.street}
      />
      <FormField
        label="Número"
        value={values.number}
        onChange={(e) => set("number", e.target.value)}
        placeholder="123"
        error={errors.number}
      />
      <FormField
        label="Bairro"
        value={values.neighborhood}
        onChange={(e) => set("neighborhood", e.target.value)}
        placeholder="Centro"
        error={errors.neighborhood}
      />
      <FormField
        label="Cidade"
        value={values.city}
        onChange={(e) => set("city", e.target.value)}
        placeholder="Goiânia"
        error={errors.city}
      />
      <FormField
        label="Estado"
        value={values.state.toUpperCase()}
        onChange={(e) => set("state", e.target.value.toUpperCase().slice(0, 2))}
        placeholder="GO"
        error={errors.state}
        maxLength={2}
      />
      <FormField
        label="Complemento"
        optional
        value={values.complement}
        onChange={(e) => set("complement", e.target.value)}
        placeholder="Sala, bloco, referência..."
        error={errors.complement}
        className="sm:col-span-2"
      />
    </div>
  );
}

export function validateAddress(values: AddressFormValues): Partial<Record<keyof AddressFormValues, string>> {
  const errors: Partial<Record<keyof AddressFormValues, string>> = {};
  if (values.cep.replace(/\D/g, "").length !== 8) errors.cep = "Informe um CEP válido.";
  if (!values.street.trim()) errors.street = "Informe a rua.";
  if (!values.number.trim()) errors.number = "Informe o número.";
  if (!values.neighborhood.trim()) errors.neighborhood = "Informe o bairro.";
  if (!values.city.trim()) errors.city = "Informe a cidade.";
  if (values.state.trim().length !== 2) errors.state = "Informe a UF (2 letras).";
  return errors;
}
