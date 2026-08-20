# Frontend — Páginas

---

## Login

**Arquivo:** `src/pages/Login.tsx`

Formulário de autenticação com email e senha. Centralizado na tela.

**Estado:** email, password, isLoading, error

**Fluxo:**
1. Preenche email + senha
2. Chama `login()` → POST `/api/auth/login/`
3. Sucesso: `setAccessToken(response.access)` → Dashboard
4. Erro: `setError("Email ou senha inválidos.")`

---

## Dashboard

**Arquivo:** `src/pages/Dashboard.tsx`

Página principal com resumo da oficina.

**Componentes:**
- `QuickActions` — 4 botões de ação (sem handlers)
- `SummaryCards` — 4 cards com estatísticas (dados hardcoded)

**Dados estáticos:**
- OS: 12 (Em aberto)
- Veículos: 12 (Em atendimento)
- Clientes: 12 (Cadastrados)
- Produtos: 128 (Em estoque)

---

## Navegação

```
App.tsx
├── Se isLoading → "Carregando..."
├── Se accessToken → Dashboard
└── Se !accessToken → Login
```

**Não há react-router.** Navegação por condicional no App.tsx.
