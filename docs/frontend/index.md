# Frontend — Visão Geral

SPA construída com React 19, TypeScript, Vite 8, Tailwind CSS v4 e shadcn/ui.

---

## Stack

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Framework | React | 19.2.8 |
| Build | Vite | 8.2.0 |
| CSS | Tailwind CSS | 4.3.3 |
| UI | shadcn/ui base-nova | 4.16.2 |
| HTTP | Axios | 1.19.0 |
| Icons | @tabler/icons-react | 3.46.0 |

---

## Estrutura

```
src/
├── main.tsx              # Entry point
├── App.tsx               # Layout com Sidebar + roteamento por auth
├── contexts/             # AuthContext, ThemeContext
├── services/             # api.ts, auth, token, dashboard
├── pages/                # Login, Dashboard
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx   # Sidebar com navegação e perfil
│   └── ui/               # Componentes shadcn
└── lib/                  # utils.ts (cn helper)
```

---

## Como Rodar

```bash
pnpm install
pnpm dev          # localhost:5173
pnpm build        # build produção
pnpm lint         # oxlint
```
