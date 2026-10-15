const onlyDigits = (value: string) => value.replace(/\D/g, "");

export function maskCpfCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function maskCep(value: string): string {
  return onlyDigits(value).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

export function maskPlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

export function unmask(value: string): string {
  return onlyDigits(value);
}

export function toLocalPhoneDigits(phone: string): string {
  const digits = onlyDigits(phone);
  if (digits.length > 11) {
    return digits.slice(-11);
  }
  return digits;
}

function checkDigit(base: string, factor: number): string {
  let sum = 0;
  for (const char of base) {
    sum += Number(char) * factor--;
  }
  const rest = (sum * 10) % 11;
  return String(rest === 10 ? 0 : rest);
}

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const d1 = checkDigit(digits.slice(0, 9), 10);
  const d2 = checkDigit(digits.slice(0, 10), 11);
  return digits[9] === d1 && digits[10] === d2;
}

export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const calc = (base: string, weights: number[]) => {
    const sum = base
      .split("")
      .reduce((acc, char, index) => acc + Number(char) * weights[index], 0);
    const rest = sum % 11;
    return String(rest < 2 ? 0 : 11 - rest);
  };
  const d1 = calc(digits.slice(0, 12), weights1);
  const d2 = calc(digits.slice(0, 13), weights2);
  return digits[12] === d1 && digits[13] === d2;
}

export function isValidCpfCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length === 11 ? isValidCpf(digits) : isValidCnpj(digits);
}

export function isValidPlate(value: string): boolean {
  return /^(?:[A-Z]{3}\d{4}|[A-Z]{3}\d[A-Z]\d{2})$/.test(value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
}
