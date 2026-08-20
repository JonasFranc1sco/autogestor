# Autogestor

Sistema de gestão para oficinas mecânicas.

## Stack

- **Backend:** Python + Django 6.0.8 + DRF + SimpleJWT
- **Frontend:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + shadcn/ui
- **Banco:** PostgreSQL 16 (produção) / SQLite (desenvolvimento)
- **Infra:** Docker Compose

## Como Rodar

### Docker (Recomendado)

```bash
# Configurar variáveis
cp .env.example .env
nano .env

# Subir tudo
docker compose up --build

# Criar superusuário (em outra aba)
docker compose exec api python manage.py createsuperuser
```

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/ |
| Admin Django | http://localhost:8000/admin/ |

### Desenvolvimento Local

**Backend:**
```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend:**
```bash
cd front
pnpm install
pnpm dev
```

## Estrutura

```
autogestor/
├── api/                  # Backend Django
├── front/                # Frontend React/Vite
├── docs/                 # Documentação
├── docker-compose.yaml
├── Makefile
├── .env.example
└── README.md
```

## Comandos Úteis

```bash
make install       # Instalar dependências
make run           # Subir tudo (Docker)
make down          # Parar tudo
make build         # Build imagens
make lint          # Lint frontend
make migrate       # Rodar migrações
make createsuperuser  # Criar admin
```

## Documentação

Consulte a pasta `docs/` para documentação completa do projeto.

## Licença

Projeto acadêmico - Faculdade
