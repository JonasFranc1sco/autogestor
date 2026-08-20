# Frontend — Serviços

---

## api.ts

Duas instâncias Axios:
- `api` — Requisições autenticadas (interceptor anexa token)
- `authApi` — Login/refresh (sem interceptor)

**baseURL:** `http://localhost:8000`
**withCredentials:** `true`

### Interceptors

**Request:** Anexa `Authorization: Bearer <token>`

**Response:** Se 401, chama refresh e retry automático

### Refresh Dedup

`refreshPromise` singleton — múltiplos 401s disparam uma única chamada de refresh.

---

## auth.service.ts

- `login({ email, password })` → POST `/api/auth/login/`
- `refresh()` → POST `/api/auth/refresh/`

---

## token.service.ts

Armazenamento em memória (não localStorage).

- `getAccessToken()` — getter
- `setAccessToken(token)` — setter + notifica subscribers
- `subscribeToTokenChange(callback)` — pattern observer

---

## AuthContext

- `accessToken` — token JWT atual
- `setAccessToken(token)` — atualiza token
- `isLoading` — true até restaurar sessão

**Inicialização:** Chama `refresh()` para restaurar sessão do cookie.
