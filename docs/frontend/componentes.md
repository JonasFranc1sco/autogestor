# Frontend — Componentes

---

## shadcn/ui (base-nova)

### Button

Variantes: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
Tamanhos: `default`, `sm`, `lg`, `icon`
Props: `loading` (exibe spinner)

### Card

Sub-componentes: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardPanel`, `CardFooter`

### Input

Modos: default, `unstyled`, `nativeInput`
Tamanhos: `sm`, `default`, `lg`

### Spinner

Ícone `Loader2` do lucide-react com `animate-spin`.

### Table

Sub-componentes: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
Variante: `variant="card"`

---

## Componentes Customizados

### ThemeToggle

Botão alternar tema dark/light. Ícones `IconSun`/`IconMoon`.

### SummaryCards

Grid de 4 cards: OS, Veículos, Clientes, Produtos (dados hardcoded).

### QuickActions

Grid de 4 botões: Novo cliente, Nova OS, Novo veículo, Novo produto (sem handlers).

---

## Utilitários

### cn()

```typescript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
