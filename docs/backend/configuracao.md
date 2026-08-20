# Backend — Configuração

---

## Variáveis de Ambiente

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `SECRET_KEY` | Sim | hardcoded | Chave secreta Django |
| `DEBUG` | Sim | `True` | Modo depuração |
| `DATABASE_URL` | Não | SQLite | URL banco PostgreSQL |
| `CORS_ALLOWED_ORIGINS` | Não | `localhost:5173` | Origens CORS |
| `ALLOWED_HOSTS` | Não | `[]` | Hosts permitidos |

---

## JWT

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}
```

---

## Dependências

```
Django==6.0.8
djangorestframework==3.17.1
djangorestframework_simplejwt==5.5.1
```

**Faltantes** (usadas mas não listadas):
- `django-cors-headers`
- `django-phonenumber-field`
- `phonenumbers`
