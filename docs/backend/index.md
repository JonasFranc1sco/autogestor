# Backend — Visão Geral

API REST construída com Django 6.0.8 e Django REST Framework 3.17.1,
com autenticação JWT via SimpleJWT.

---

## Stack

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Framework | Django | 6.0.8 |
| API | Django REST Framework | 3.17.1 |
| Auth | SimpleJWT | 5.5.1 |
| DB (dev) | SQLite3 | - |
| DB (prod) | PostgreSQL | 16 |

---

## Apps

| App | Responsabilidade | Status |
|-----|------------------|--------|
| `core` | BaseModel abstrato (UUID, timestamps) | ✅ |
| `users` | Usuários, autenticação, permissões | ✅ |
| `clients` | Clientes (PF/PJ), endereços | ⚠️ Sem rotas |
| `vehicles` | Veículos vinculados a clientes | ⚠️ Sem rotas |
| `employees` | Funcionários, endereços | ⚠️ Sem rotas |
| `products` | Produtos, estoque, preços | ⚠️ Sem rotas |
| `service_order` | Ordens de serviço | ❌ Vazio |

---

## Estrutura de URLs

```
/api/
├── auth/
│   ├── login/          POST   (LoginView)     — sem auth
│   ├── refresh/        POST   (RefreshView)   — sem auth (cookie)
│   └── logout/         POST   (LogoutView)    — JWT required
├── profile/
│   ├── /               GET    (ProfileView)   — JWT required
│   └── change-password POST   (ChangePassword)— JWT required
└── users/
    ├── /               GET    (list)          — IsManager
    ├── /               POST   (create)        — IsAdmin
    ├── {id}/           GET    (retrieve)      — IsOwnerOrAdmin
    ├── {id}/           PUT    (update)        — IsOwnerOrAdmin
    └── {id}/           DELETE (destroy)       — IsAdmin (soft delete)
```

---

## Endpoints Disponíveis

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| POST | `/api/auth/login/` | Não | Login |
| POST | `/api/auth/refresh/` | Cookie | Renovar access token |
| POST | `/api/auth/logout/` | JWT | Logout + blacklist |
| GET | `/api/profile/` | JWT | Obter perfil |
| PATCH | `/api/profile/` | JWT | Atualizar nome |
| POST | `/api/profile/change-password` | JWT | Alterar senha |
| GET | `/api/users/` | IsManager | Listar usuários |
| POST | `/api/users/` | IsAdmin | Criar usuário |
| GET | `/api/users/{id}/` | IsOwnerOrAdmin | Detalhes |
| PUT | `/api/users/{id}/` | IsOwnerOrAdmin | Atualizar |
| DELETE | `/api/users/{id}/` | IsAdmin | Soft delete |
