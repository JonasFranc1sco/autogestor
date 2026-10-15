# Backend — Referência da API

---

## Base URL

| Ambiente | URL |
|----------|-----|
| Desenvolvimento | `http://localhost:8000` |
| Produção | `https://api.autogestor.com.br` |

---

## Autenticação

JWT via SimpleJWT. Access token (5 min) no header, refresh token (7 dias) em cookie httponly.

```
Content-Type: application/json
Authorization: Bearer <access_token>
```

---

## Endpoints

### Auth — Login

```
POST /api/auth/login/
```

**Request:**
```json
{ "email": "usuario@email.com", "password": "senha123" }
```

**Response (200):**
```json
{ "access": "eyJ..." }
```

---

### Auth — Refresh

```
POST /api/auth/refresh/
```

Cookie `refresh_token` enviado automaticamente.

**Response (200):**
```json
{ "access": "eyJ..." }
```

---

### Auth — Registro (nova oficina)

```
POST /api/auth/register/
```

Cria a oficina e o usuário administrador (owner), retornando os mesmos
tokens do login.

**Request:**
```json
{
  "workshop": { "name": "Oficina Nova", "cnpj": "12.345.678/0001-90" },
  "full_name": "Maria Dona",
  "email": "maria@oficinanova.com",
  "password": "senhaForte123"
}
```

**Response (201):**
```json
{ "access": "eyJ..." }
```

---

### Auth — Logout

```
POST /api/auth/logout/
```

Usa o cookie `refresh_token` automaticamente (o body `{ "refresh": "..." }`
ainda é aceito como alternativa). Invalida o token na blacklist e limpa o
cookie.

**Response:** `205 Reset Content`

---

### Profile

```
GET  /api/profile/            — Obter perfil (inclui dados da oficina)
PATCH /api/profile/           — Atualizar nome
POST /api/profile/change-password/ — Alterar senha
```

---

### Users

```
GET    /api/users/          — Listar (IsManager)
POST   /api/users/          — Criar (IsAdmin)
GET    /api/users/{id}/     — Detalhes (IsOwnerOrAdmin)
PUT    /api/users/{id}/     — Atualizar (IsOwnerOrAdmin)
DELETE /api/users/{id}/     — Soft delete (IsAdmin)
```

---

### Workshop

```
GET   /api/workshop/ — Dados da oficina do usuário autenticado
PATCH /api/workshop/ — Atualizar dados da oficina (IsManagerOrAdmin)
```

---

### Ordens de Serviço — transição de status

```
POST /api/service-orders/{id}/change-status/
```

**Request:**
```json
{ "status": "IN_PROGRESS" }
```

Transições válidas: `OPEN → IN_PROGRESS | WAITING_PARTS | WAITING_CLIENT | CANCELLED`,
`IN_PROGRESS → WAITING_PARTS | WAITING_CLIENT | DONE | CANCELLED`,
`WAITING_* → IN_PROGRESS | CANCELLED`. `DONE` e `CANCELLED` são terminais.

---

## Paginação e Busca

Todas as listas usam paginação por página:

```json
{ "count": 120, "next": "...", "previous": null, "results": [ ... ] }
```

Parâmetros: `page`, `page_size` (máx. 200), `search`, `ordering` e filtros
por campo (ex: `?status=OPEN`, `?client=<id>`).

---

## Tabela Resumo

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/login/` | Não | Login |
| POST | `/api/auth/register/` | Não | Cadastrar oficina |
| POST | `/api/auth/refresh/` | Cookie | Renovar token |
| POST | `/api/auth/logout/` | JWT + Cookie | Logout |
| GET | `/api/profile/` | JWT | Perfil |
| PATCH | `/api/profile/` | JWT | Atualizar perfil |
| POST | `/api/profile/change-password/` | JWT | Alterar senha |
| GET | `/api/workshop/` | JWT | Dados da oficina |
| GET | `/api/users/` | IsManager | Listar |
| POST | `/api/users/` | IsAdmin | Criar |
| GET | `/api/users/{id}/` | IsOwnerOrAdmin | Detalhes |
| PUT | `/api/users/{id}/` | IsOwnerOrAdmin | Atualizar |
| DELETE | `/api/users/{id}/` | IsAdmin | Soft delete |
