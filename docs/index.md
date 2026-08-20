# Autogestor — Visão Geral

Sistema de gestão para oficinas mecânicas, desenvolvido como projeto de faculdade.
Gerencia clientes, veículos, funcionários, produtos e ordens de serviço.

---

## Propósito

O Autogestor é uma aplicação web completa para gerenciamento de oficinas mecânicas.
O sistema permite cadastrar clientes (PF/PJ), veículos vinculados a clientes, funcionários,
produtos/parts com controle de estoque, e ordens de serviço (em implementação).

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Backend | Python + Django + DRF | Django 6.0.8 |
| Banco | PostgreSQL (produção) / SQLite (dev) | - |
| Auth | JWT (SimpleJWT) | 5.5.1 |
| Frontend | React + TypeScript | React 19.2.8 |
| Build | Vite | 8.2.0 |
| CSS | Tailwind CSS v4 | 4.3.3 |
| UI | shadcn/ui (base-nova) | 4.16.2 |
| Lint | Oxlint | 1.75.0 |
| Infra | Docker Compose | - |

---

## Módulos do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    AUTOGESTOR                           │
├─────────────┬─────────────┬─────────────┬───────────────┤
│  Clientes   │  Veículos   │ Funcionários│   Produtos    │
│  (PF/PJ)    │  (placa,    │  (CPF, RG,  │  (estoque,    │
│  CPF/CNPJ,  │  marca,     │  endereço)  │  preço custo/ │
│  endereço)  │  modelo)    │             │  venda, margem│
├─────────────┴─────────────┴─────────────┴───────────────┤
│                  Ordens de Serviço                       │
│                  (em implementação)                      │
├─────────────────────────────────────────────────────────┤
│                    Autenticação                          │
│            JWT (login, refresh, logout)                  │
│         Roles: Admin, Gerente, Mecânico, Atendente      │
└─────────────────────────────────────────────────────────┘
```

---

## Diagrama de Alto Nível

```
                         ┌──────────────────┐
                         │     Cliente      │
                         │   (Navegador)    │
                         └────────┬─────────┘
                                  │
                                  │ HTTP
                                  ▼
                    ┌─────────────────────────┐
                    │   Frontend (React/Vite)  │
                    │   localhost:3000         │
                    │                         │
                    │  - Login                │
                    │  - Dashboard            │
                    │  - Gerenciamento CRUD   │
                    └────────────┬────────────┘
                                 │
                                 │ Axios (JSON + Cookies)
                                 │ withCredentials: true
                                 ▼
                    ┌─────────────────────────┐
                    │   Backend (Django/DRF)   │
                    │   localhost:8000         │
                    │                         │
                    │  - /api/auth/*           │
                    │  - /api/users/*          │
                    │  - /api/clients/*        │
                    │  - /api/vehicles/*       │
                    │  - /api/employees/*      │
                    │  - /api/products/*       │
                    └────────────┬────────────┘
                                 │
                                 │ SQL (asyncpg/psycopg2)
                                 ▼
                    ┌─────────────────────────┐
                    │     PostgreSQL           │
                    │   (Docker Container)     │
                    │   porta 5432             │
                    └─────────────────────────┘
```

---

## Estrutura do Monorepo

```
autogestor/
├── api/                  # Backend Django
├── front/                # Frontend React/Vite
├── docs/                 # Esta documentação
├── docker-compose.yaml   # Orquestração dos serviços
├── Makefile              # Comandos de conveniência
├── .env.example          # Variáveis de ambiente
├── CLAUDE.md             # Contexto para IA
└── README.md             # Como rodar
```

---

## Funcionalidades Implementadas

| Módulo | Status | Descrição |
|--------|--------|-----------|
| Autenticação | ✅ Completo | Login, refresh token (httponly cookie), logout, blacklist |
| Usuários | ✅ Completo | CRUD com permissões por role (Admin, Gerente) |
| Clientes | ⚠️ Parcial | Modelos e serializers prontos, rotas não registradas |
| Veículos | ⚠️ Parcial | Modelos e serializers prontos, rotas não registradas |
| Funcionários | ⚠️ Parcial | Modelos e serializers prontos, rotas não registradas |
| Produtos | ⚠️ Parcial | Modelos e serializers prontos, rotas não registradas |
| Ordens de Serviço | ❌ Vazio | App criada sem implementação |

---

## Como Acessar

- **Frontend:** `http://localhost:3000` (Docker) ou `http://localhost:5173` (dev)
- **Backend:** `http://localhost:8000/api/`
- **Admin Django:** `http://localhost:8000/admin/`

---

## Público-Alvo

Sistema destinado a oficinas mecânicas que precisam gerenciar:
- Cadastro de clientes (pessoa física e jurídica)
- Cadastro e acompanhamento de veículos
- Controle de estoque de peças e produtos
- Gestão de funcionários da oficina
- Ordens de serviço (em desenvolvimento)
