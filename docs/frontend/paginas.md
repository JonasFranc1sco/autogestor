# Frontend — Páginas

---

## Login

**Arquivo:** `src/pages/Login.tsx`

Página de autenticação com identidade visual do sistema.

**Layout:**
- Logo com ícone de carro e animação sutil (`animate-logo-pulse`)
- Texto "AUTO**GESTOR**" com destaque laranja
- Card com inputs (email + senha) e ícones
- Botão "Entrar" com loading spinner
- Mensagem de erro com fundo destructive

**Estado:** email, password, isLoading, error

**Fluxo:**
1. Preenche email + senha
2. Chama `login()` → POST `/api/auth/login/`
3. Sucesso: `setAccessToken(response.access)` → Dashboard
4. Erro: `setError("Email ou senha inválidos.")`

---

## Dashboard

**Arquivo:** `src/pages/Dashboard.tsx`

Página principal com layout completo.

**Layout:**
- **Header** — título "Dashboard" + ícones de notificação e perfil
- **Boas-vindas** — "Olá, Vitor!" + widget com data atual
- **Ações rápidas** — grid de 4 cards (Novo Cliente, Nova OS, Novo Veículo, Novo Produto)
- **Resumo** — grid de 4 cards com estatísticas (OS, Veículos, Clientes, Produtos)
- **OS recentes** — tabela com últimas 4 ordens de serviço e badges de status
- **Atividade recente** — timeline com eventos do sistema

**Dados:** Todos fictícios (hardcoded)

**Status das OS:**
| Status | Cor | Label |
|--------|-----|-------|
| `progress` | Laranja | Em andamento |
| `waiting` | Amarelo | Aguardando peças |
| `client` | Azul | Aguardando cliente |
| `done` | Verde | Concluída |

---

## Navegação

```
App.tsx
├── Se isLoading → "Carregando..."
├── Se !accessToken → Login
└── Se accessToken → Sidebar + Dashboard
```

**Não há react-router.** Navegação por condicional no App.tsx.
