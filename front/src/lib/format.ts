export function formatCurrency(value: string | number | null | undefined): string {
  const amount = typeof value === "string" ? Number.parseFloat(value) : (value ?? 0);
  return (Number.isFinite(amount) ? amount : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function parseDecimalValue(value: string): number {
  return tryParseDecimalNumber(value) ?? 0;
}

export function tryParseDecimalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function tryParseDecimal(value: string): string | null {
  const parsed = tryParseDecimalNumber(value);
  return parsed === null ? null : parsed.toFixed(2);
}
