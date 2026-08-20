# Frontend — Configuração

---

## vite.config.ts

```typescript
plugins: [react(), tailwindcss()]
resolve.alias: { "@": "./src" }
```

---

## TypeScript

Target: ES2023, Module: ESNext, JSX: react-jsx, Strict: true

---

## Tailwind CSS v4

- Importa `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`
- Dark mode: classe `.dark` no `<html>`
- Fonte: Geist Variable
- CSS variables: oklch color space

---

## shadcn/ui

- Style: `base-nova` (@base-ui/react)
- Base color: `neutral`
- CSS variables: true
- Icon library: `lucide`

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Dev server (5173) |
| `pnpm build` | Type check + build |
| `pnpm lint` | Oxlint |
| `pnpm preview` | Preview build (4173) |
