# Autogestor — Contexto do Projeto

## Visão Geral

Sistema de gestão para oficinas mecânicas. Monorepo com backend Django e frontend React.

## Estrutura

```
autogestor/
├── api/        # Backend Django 6.0.8 + DRF + SimpleJWT
├── front/      # Frontend React 19 + Vite 8 + Tailwind v4 + shadcn/ui
├── docs/       # Documentação técnica
├── docker-compose.yaml
├── Makefile
└── .env.example
```

## Stack

- **Backend:** Python 3.12, Django 6.0.8, DRF 3.17.1, SimpleJWT 5.5.1, django-filter
- **Frontend:** React 19, TypeScript 6, Vite 8, Tailwind CSS v4, shadcn/ui base-nova
- **Banco:** PostgreSQL 16 (produção) / SQLite (dev)
- **Auth:** JWT com refresh token httponly cookie
- **Infra:** Docker Compose

## Comandos

```bash
make install          # Instalar dependências
make run              # Docker compose up --build
make down             # Docker compose down
make lint             # pnpm lint no frontend
make migrate          # python manage.py migrate
make createsuperuser  # Criar admin
```

## Convenções

- Código em **português** (nomes de variáveis, comentários, commits)
- Commits seguem **Conventional Commits** em português
- Frontend usa **path alias** `@/` para `src/`
- Backend usa **ViewSets** com DRF
- Auth via **JWT** com refresh em cookie httponly
- **Multi-tenant (SaaS):** todo model de negócio tem FK `workshop`; o
  isolamento é aplicado por `core/tenancy.py` (`TenantViewSetMixin`,
  `scope_queryset`, `TenantPrimaryKeyRelatedField`). Nunca expor dados de
  outra oficina.
- Soft delete via `is_active` (clientes, veículos, produtos, serviços,
  funcionários, usuários); ordens de serviço nunca são listadas como ocultas.

## Migrações

As migrations iniciais foram **recriadas** em `feat(multi-tenant)`. Bancos de
desenvolvimento antigos devem ser recriados (`rm api/db.sqlite3 && make migrate`
ou `make down-clean && make run`).

## Bugs Conhecidos

- Nenhum bug conhecido no momento

## Deploy

Produção via Docker na VPS. Ver `docs/deploy/vps.md`.
