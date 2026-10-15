# Backend — Autenticação

Fluxo detalhado do sistema de autenticação JWT.

---

## Fluxo Geral

```
┌──────────┐                              ┌──────────┐
│  Frontend │                              │ Backend  │
└────┬─────┘                              └────┬─────┘
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
     │                                         │
     │  3. GET /api/users/                     │
     │     Authorization: Bearer <access>      │
     │────────────────────────────────────────>│
     │                                         │
     │  4. Se 401 (token expirado):            │
     │     POST /api/auth/refresh/             │
     │────────────────────────────────────────>│
     │                                         │
     │  5. Novo access + novo refresh          │
     │<────────────────────────────────────────│
     │                                         │
     │  6. Retry da requisição original        │
     │────────────────────────────────────────>│
     │                                         │
     │  7. POST /api/auth/logout/              │
     │────────────────────────────────────────>│
     │     205 Reset Content                   │
     │<────────────────────────────────────────│
```

---

## Tokens

| Propriedade | Access Token | Refresh Token |
|-------------|--------------|---------------|
| Vida útil | 5 minutos | 7 dias |
| Armazenamento | Em memória (JS) | Cookie HttpOnly |
| Envio | Header Authorization | Automático |
| Rotação | - | Sim |
| Blacklist | - | Sim |

---

## Permissões

| Classe | Regra | Uso |
|--------|-------|-----|
| `IsAdmin` | `role == ADMIN` | Criar usuários |
| `IsManagerOrAdmin` | `role in [ADMIN, MANAGER]` | Listar usuários, dados da oficina |
| `IsOwnerOrAdmin` | `obj == user` ou `ADMIN` | Ver/editar perfil |
| `CanManageClients` | escrita: ADMIN/MANAGER/ATTENDANT | Clientes |
| `CanManageVehicles` | escrita: ADMIN/MANAGER/ATTENDANT | Veículos |
| `CanManageProducts` | escrita: ADMIN/MANAGER/ATTENDANT | Produtos |
| `CanManageEmployees` | escrita: ADMIN/MANAGER | Funcionários |
| `CanManageServices` | escrita: ADMIN/MANAGER | Catálogo de serviços |
| `CanManageServiceOrders` | escrita: ADMIN/MANAGER/ATTENDANT/MECHANIC; delete: ADMIN/MANAGER | Ordens de serviço |
| `IsAuthenticated` | `is_authenticated` | Qualquer rota JWT |

Observações:

- O papel `MECHANIC` só altera `observations`/`mechanic` em OS e usa
  `POST /api/service-orders/{id}/change-status/` para transições.
- `cost_price`/`margin_percentage` de produtos e serviços não são expostos
  para papéis fora de ADMIN/MANAGER.
- Além do papel, todo acesso é filtrado pela oficina do usuário
  (`core/tenancy.py`).

---

## Blacklist

Tokens antigos vão para blacklist após rotação.
Ao alterar senha, todos os tokens do usuário são invalidados.
