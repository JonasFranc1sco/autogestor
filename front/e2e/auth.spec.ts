import { test, expect } from "@playwright/test";
import { login, DEMO_EMAIL, DEMO_PASSWORD } from "./helpers";

test.describe("Autenticação", () => {
  test("login exibe dashboard real e logout encerra a sessão", async ({ page }) => {
    await login(page);

    // Dashboard real: sem dados fake, com cards e dados da oficina
    await expect(page.getByRole("heading", { name: "Ordens de Serviço Recentes" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Estoque Baixo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Novo Cliente" })).toBeVisible();

    // Logout
    await page.getByRole("button", { name: "Sair da conta" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("credenciais inválidas exibem erro claro", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(DEMO_EMAIL);
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert")).toContainText(/Email ou senha inválidos/);
  });

  test("rota protegida redireciona para login sem sessão", async ({ page }) => {
    await page.goto("/clientes");
    await expect(page).toHaveURL(/\/login/);
  });
});
