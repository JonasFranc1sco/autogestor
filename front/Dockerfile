# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar pnpm (versão compatível com Node 20)
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copiar dependências
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

# Copiar código
COPY . .

# Build
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

# Stage 2: Production
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
