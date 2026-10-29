FROM python:3.12-slim

# Boas práticas para Python no Docker: 
# Evita a criação de arquivos .pyc e não guarda os logs em buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 1. Criar um usuário e grupo de sistema não-root
RUN addgroup --system appgroup && adduser --system --group appuser

# Instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Static files servidos via whitenoise
RUN SECRET_KEY=build-only python manage.py collectstatic --noinput

# 2. Transferir a propriedade dos arquivos para o usuário não-root
# Isso garante que a aplicação consiga gerenciar uploads (ex: pasta media/) 
# ou ler os arquivos estáticos criados no passo anterior
RUN chown -R appuser:appgroup /app

# 3. Mudar do usuário root (padrão) para o nosso usuário seguro
USER appuser

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]