import { maskCep, unmask } from "@/lib/masks";
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
  function set<K extends keyof AddressFormValues>(key: K, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField
        label="CEP"
        value={maskCep(values.cep)}
        onChange={(e) => set("cep", unmask(e.target.value))}
        placeholder="76800-000"
        error={errors.cep}
        maxLength={9}
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
