# Guia — Início Rápido

---

## Pré-requisitos

| Opção Docker | Opção Local |
|--------------|-------------|
| Docker 24+ | Python 3.12+ |
| Docker Compose v2+ | Node.js 20+ |
| Git | pnpm, PostgreSQL |

---

## Docker (Recomendado)

```bash
cp .env.example .env
nano .env
docker compose up --build
# Em outra aba:
docker compose exec api python manage.py createsuperuser
```

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000/api/ |
| Admin | http://localhost:8000/admin/ |

---

## Desenvolvimento Local

**Backend:**
```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Frontend:**
```bash
cd front
pnpm install
pnpm dev
```

---

## Comandos Úteis

```bash
# Docker
docker compose up --build
docker compose down
docker compose logs -f

# Backend
python manage.py migrate
python manage.py createsuperuser
python manage.py shell

# Frontend
pnpm dev
pnpm build
pnpm lint
```
