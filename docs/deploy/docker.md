# Deploy — Docker Compose

---

## Serviços

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   postgres   │  │     api      │  │    front     │
│  PostgreSQL  │  │  Django      │  │  Nginx       │
│  porta 5432  │  │  porta 8000  │  │  porta 3000  │
│  volume:     │  │  depends_on: │  │    ↓:80      │
│  pgdata      │  │  postgres    │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Comandos

```bash
docker compose up --build        # Subir com rebuild
docker compose up -d --build     # Background
docker compose down              # Parar
docker compose down -v           # Parar + limpar volumes
docker compose logs -f           # Logs
docker compose ps                # Status
```

---

## Variáveis

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `SECRET_KEY` | Sim | Chave Django |
| `DEBUG` | Sim | True/False |
| `DB_PASSWORD` | Sim | Senha PostgreSQL |
| `VITE_API_URL` | Sim | URL da API |
