# Frontend — Componentes

---

## Layout

### Sidebar

**Arquivo:** `src/components/layout/Sidebar.tsx`

Sidebar fixa com 260px de largura.

**Elementos:**
- Logo com ícone de carro (`IconCar`) e animação `logo-pulse`
- Texto "AUTO**GESTOR**" com destaque primary
- Menu de navegação com 9 itens (Dashboard, Clientes, OS, Veículos, Produtos, Financeiro, Relatórios, Agenda, Configurações)
- Item ativo com fundo primary/10 e borda primary/20
- Perfil do usuário no rodapé (avatar, nome, role, botão logout)

**Ícones:** @tabler/icons-react

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

## Utilitários

### cn()

```typescript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Animações

### logo-pulse

Animação sutil de escala aplicada ao ícone da logo.

```css
@keyframes logo-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
```

Classe: `animate-logo-pulse`
