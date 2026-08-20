# Deploy — Guia VPS

---

## Pré-requisitos

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

---

## Passo a Passo

```bash
# 1. Clonar
git clone <url> /home/$USER/autogestor
cd /home/$USER/autogestor

# 2. Configurar .env
cp .env.example .env
nano .env

# 3. Subir
docker compose up -d --build

# 4. Migrações
docker compose exec api python manage.py migrate

# 5. Superusuário
docker compose exec api python manage.py createsuperuser
```

---

## Portas

| Serviço | Porta | Exposta |
|---------|-------|---------|
| Frontend | 3000 | Sim |
| API | 8000 | Sim |
| PostgreSQL | 5432 | Não |

---

## Nginx Reverso (HTTPS)

```nginx
server {
    listen 443 ssl;
    server_name autogestor.com.br;

    ssl_certificate /etc/letsencrypt/live/autogestor.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/autogestor.com.br/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
    }
}
```

---

## Backup

```bash
# Backup
docker compose exec postgres pg_dump -U autogestor autogestor > backup.sql

# Restaurar
docker compose exec -T postgres psql -U autogestor autogestor < backup.sql
```
