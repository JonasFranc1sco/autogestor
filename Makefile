.PHONY: install run run-api run-front build down lint format

# Instalar dependências de todos os sub-projetos
install:
	cd api && pip install -r requirements.txt
	cd front && pnpm install

# Rodar tudo via Docker
run:
	docker compose up --build

# Rodar em background
run-detached:
	docker compose up -d --build

# Rodar só a API
run-api:
	cd api && python manage.py runserver

# Rodar só o Frontend
run-front:
	cd front && pnpm dev

# Build das imagens
build:
	docker compose build

# Parar tudo
down:
	docker compose down

# Parar e limpar volumes
down-clean:
	docker compose down -v

# Lint
lint:
	cd front && pnpm lint

# Formatar código Python
format:
	cd api && isort . && blue .

# Criar superusuário
createsuperuser:
	docker compose exec api python manage.py createsuperuser

# Migrações
migrate:
	docker compose exec api python manage.py migrate

# Logs
logs:
	docker compose logs -f

# Status
status:
	docker compose ps
