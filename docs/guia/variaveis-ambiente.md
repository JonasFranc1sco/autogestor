# Guia — Variáveis de Ambiente

---

## Backend

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `SECRET_KEY` | Sim | hardcoded | Chave Django |
| `DEBUG` | Sim | `True` | Depuração |
| `DATABASE_URL` | Não | SQLite | URL PostgreSQL |
| `DB_NAME` | Não | `autogestor` | Nome banco |
| `DB_USER` | Não | `autogestor` | Usuário banco |
| `DB_PASSWORD` | Sim (prod) | - | Senha banco |
| `DB_HOST` | Não | `localhost` | Host banco |
| `DB_PORT` | Não | `5432` | Porta banco |
| `CORS_ALLOWED_ORIGINS` | Não | `localhost:5173` | Origens CORS |
| `ALLOWED_HOSTS` | Não | `[]` | Hosts permitidos |

---

## Frontend

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `VITE_API_URL` | Sim | `http://localhost:8000` | URL da API |

---

## PostgreSQL

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `POSTGRES_DB` | Sim | `autogestor` | Nome banco |
| `POSTGRES_USER` | Sim | `autogestor` | Usuário |
| `POSTGRES_PASSWORD` | Sim | - | Senha |

---

## Template .env

```bash
# Backend
SECRET_KEY=
DEBUG=True
DB_PASSWORD=
VITE_API_URL=http://localhost:8000
```
