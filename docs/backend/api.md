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

### Auth — Logout

```
POST /api/auth/logout/
```

**Request:**
```json
{ "refresh": "eyJ..." }
```

**Response:** `205 Reset Content`

---

### Profile

```
GET  /api/profile/          — Obter perfil
PATCH /api/profile/         — Atualizar nome
POST /api/profile/change-password — Alterar senha
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

## Tabela Resumo

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/login/` | Não | Login |
| POST | `/api/auth/refresh/` | Cookie | Renovar token |
| POST | `/api/auth/logout/` | JWT | Logout |
| GET | `/api/profile/` | JWT | Perfil |
| PATCH | `/api/profile/` | JWT | Atualizar perfil |
| POST | `/api/profile/change-password` | JWT | Alterar senha |
| GET | `/api/users/` | IsManager | Listar |
| POST | `/api/users/` | IsAdmin | Criar |
| GET | `/api/users/{id}/` | IsOwnerOrAdmin | Detalhes |
| PUT | `/api/users/{id}/` | IsOwnerOrAdmin | Atualizar |
| DELETE | `/api/users/{id}/` | IsAdmin | Soft delete |
