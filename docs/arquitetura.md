# Arquitetura do Sistema

Visão detalhada da arquitetura do Autogestor, incluindo estrutura de pastas,
fluxos de autenticação e padrões adotados.

---

## Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
│  │  Pages   │  │  Components  │  │  Contexts  │  │  Services │ │
│  │          │  │              │  │            │  │           │ │
│  │ Login    │  │ ThemeToggle  │  │ AuthCtx    │  │ api.ts    │ │
│  │ Dashboard│  │ SummaryCards │  │ ThemeCtx   │  │ auth.svc  │ │
│  │          │  │ QuickActions │  │            │  │ token.svc │ │
│  │          │  │ ui/*         │  │            │  │ dash.svc  │ │
│  └──────────┘  └──────────────┘  └────────────┘  └───────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Lib / Utils                           │   │
│  │                    cn() helper                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP (Axios + JWT)
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     config/                               │   │
│  │  settings.py  │  urls.py  │  wsgi.py  │  asgi.py        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  users/  │ │ clients/ │ │vehicles/ │ │products/ │          │
│  │          │ │          │ │          │ │          │          │
│  │ models   │ │ models   │ │ models   │ │ models   │          │
│  │ views/   │ │ views    │ │ views    │ │ views    │          │
│  │ serializers│ │ serializers│ │ serializers│ │ serializers│          │
│  │ services │ │          │ │          │ │          │          │
│  │ perms    │ │          │ │          │ │          │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                  │
│  ┌──────────┐ ┌──────────────┐                                  │
│  │  core/   │ │ employees/   │                                  │
│  │          │ │              │                                  │
│  │ BaseModel│ │ models       │                                  │
│  │ (UUID)   │ │ views        │                                  │
│  │          │ │ serializers  │                                  │
│  └──────────┘ └──────────────┘                                  │
└──────────────────────────────────────────────────────────────────┘
                                │
                                │ SQL
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                       DATABASE                                   │
│                                                                  │
│  PostgreSQL (produção) / SQLite (desenvolvimento)                │
│                                                                  │
│  Tabelas:                                                        │
│  - users_user (custom, UUID pk)                                 │
│  - users_user_groups                                            │
│  - users_user_user_permissions                                  │
│  - clients_address                                              │
│  - clients_client                                               │
│  - employees_address                                            │
│  - employees_employee                                           │
│  - products_product                                             │
│  - vehicles_vehicle                                             │
│  - token_blacklist_* (SimpleJWT)                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Pastas — Backend

```
api/
├── manage.py                    # Comandos de administração Django
├── requirements.txt             # Dependências Python
├── db.sqlite3                   # Banco SQLite (dev, gitignored)
│
├── config/                      # Configurações do projeto
│   ├── __init__.py
│   ├── settings.py              # Settings principais
│   ├── urls.py                  # URL routing raiz
│   ├── wsgi.py                  # WSGI entry point
│   └── asgi.py                  # ASGI entry point
│
├── core/                        # Módulo compartilhado
│   └── models.py                # BaseModel (UUID, created_at, updated_at, is_active)
│
├── users/                       # Autenticação e gestão de usuários
│   ├── models.py                # User (AbstractBaseUser + BaseModel), Role
│   ├── managers.py              # UserManager
│   ├── permissions.py           # IsAdmin, IsManager, IsOwnerOrAdmin
│   ├── urls.py                  # Rotas: auth/*, profile/*, users/*
│   ├── views/                   # ViewSets e APIViews
│   ├── serializers/             # Serializers por contexto
│   └── services/                # AuthService, PasswordService
│
├── clients/                     # Gestão de clientes
├── vehicles/                    # Gestão de veículos
├── employees/                   # Gestão de funcionários
├── products/                    # Gestão de produtos/estoque
└── service_order/               # Ordens de serviço (vazio)
```

---

## Estrutura de Pastas — Frontend

```
front/
├── index.html                   # Entry point HTML
├── package.json                 # Dependências Node
├── pnpm-lock.yaml               # Lockfile (pnpm)
├── vite.config.ts               # Configuração Vite
├── tsconfig.json                # TypeScript config
├── components.json              # Config shadcn/ui
│
└── src/
    ├── main.tsx                 # ReactDOM.render (StrictMode + Providers)
    ├── App.tsx                  # Roteamento por auth (ternário)
    ├── index.css                # Tailwind v4 + shadcn theme tokens
    │
    ├── contexts/
    │   ├── AuthContext.tsx       # Estado de autenticação
    │   └── ThemeContext.tsx      # Toggle dark/light
    │
    ├── services/
    │   ├── api.ts               # Instâncias Axios + interceptors
    │   ├── auth.service.ts      # login(), refresh()
    │   ├── token.service.ts     # Armazenamento em memória
    │   └── dashboard.service.ts # getDashboard()
    │
    ├── pages/
    │   ├── Login.tsx            # Formulário email/senha
    │   └── Dashboard.tsx        # Dashboard com cards
    │
    ├── components/
    │   ├── ThemeToggle.tsx      # Botão alternar tema
    │   ├── dashboard/           # SummaryCards, QuickActions
    │   └── ui/                  # shadcn/base-nova
    │
    └── lib/
        └── utils.ts             # cn() helper
```

---

## Fluxo de Autenticação (JWT)

```
┌──────────┐                              ┌──────────┐
│  Frontend │                              │ Backend  │
└────┬─────┘                              └────┬─────┘
     │                                         │
     │  1. POST /api/auth/login/               │
     │     { email, password }                 │
     │────────────────────────────────────────>│
     │                                         │
     │  2. Valida credenciais                  │
     │     Gera tokens:                        │
     │     - access (5 min, no body)           │
     │     - refresh (7 dias, httponly cookie) │
     │<────────────────────────────────────────│
     │     { access: "eyJ..." }                │
     │     Set-Cookie: refresh_token=...       │
     │                                         │
     │  3. Requisição autenticada              │
     │     Authorization: Bearer <access>      │
     │────────────────────────────────────────>│
     │                                         │
     │  4. Se 401 (token expirado):            │
     │     POST /api/auth/refresh/             │
     │     (cookie refresh_token enviado)      │
     │────────────────────────────────────────>│
     │                                         │
     │  5. Novo access + novo refresh          │
     │<────────────────────────────────────────│
     │                                         │
     │  6. Retry da requisição original        │
     │────────────────────────────────────────>│
     │                                         │
     │  7. POST /api/auth/logout/              │
     │     (blacklist do refresh token)        │
     │────────────────────────────────────────>│
     │     205 Reset Content                   │
     │<────────────────────────────────────────│
```

---

## Padrões Adotados

### Backend

| Padrão | Implementação |
|--------|---------------|
| Modelo abstrato | `BaseModel` com UUID, created_at, updated_at, is_active |
| Auth stateless | JWT com refresh cookie httponly |
| Permissões | Classes customizadas (IsAdmin, IsManager, IsOwnerOrAdmin) |
| Serializers | Múltiplos por model (List, Detail, Create, Update) |
| Soft delete | `perform_destroy` seta `is_active=False` |
| ViewSets | ModelViewSet com queryset e serializer_class |

### Frontend

| Padrão | Implementação |
|--------|---------------|
| Token storage | Em memória (não localStorage/cookie) |
| Refresh dedup | `refreshPromise` singleton |
| Interceptor 401 | Retry automático com novo token |
| Tema | Dark/light via class toggle no `<html>` |
| Componentes | shadcn/ui base-nova (@base-ui/react) |
| Estilo | Tailwind CSS v4 com CSS variables (oklch) |

---

## Segurança

| Aspecto | Implementação |
|---------|---------------|
| Senhas | Validadas pelo Django (4 validadores) |
| Refresh token | HttpOnly cookie |
| Token blacklist | SimpleJWT token_blacklist |
| CORS | Configurado para localhost (dev) |
| SECRET_KEY | Hardcoded (precisa externalizar) |
| DEBUG | True hardcoded (precisa externalizar) |
