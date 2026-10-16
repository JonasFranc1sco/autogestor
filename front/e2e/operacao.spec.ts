import { test, expect } from "@playwright/test";
import { login, selectOptionByText } from "./helpers";

test.describe("Operação da oficina", () => {
  test("agenda: criar agendamento e marcar como realizado", async ({ page }) => {
    await login(page);
    await page.goto("/agenda");

    await page.getByRole("button", { name: "Novo Agendamento" }).click();
    await selectOptionByText(page, "Cliente", "João Silva");
    await selectOptionByText(page, "Veículo", "BRA2E19");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);

    await page.getByLabel(/^Data/).fill(dateStr);
    await page.getByLabel(/^Horário/).fill("10:00");
    await page.getByLabel(/^Descrição/).fill("Alinhamento e balanceamento");
    await page.getByRole("button", { name: "Agendar" }).click();
    await expect(page.getByText("Agendamento criado com sucesso")).toBeVisible();
    await expect(page.getByRole("cell", { name: "João Silva" }).first()).toBeVisible();

    // Marcar como realizado
    await page.getByRole("button", { name: /Realizado agendamento/ }).first().click();
    await expect(page.getByText("Realizado").first()).toBeVisible();
  });

  test("estoque: movimentação manual atualiza o saldo", async ({ page }) => {
    await login(page);
    await page.goto("/estoque");

    await page.getByRole("button", { name: "Nova Movimentação" }).click();
    await selectOptionByText(page, "Produto", "Filtro de Óleo");
    await page.getByLabel(/^Tipo\ de\ movimentação/).selectOption("IN");
    await page.getByLabel(/^Quantidade/).fill("5");
    await page.getByLabel(/^Motivo/).fill("Compra NF Playwright");
    await page.getByRole("button", { name: "Registrar" }).last().click();
    await expect(page.getByText("Movimentação registrada com sucesso")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Compra NF Playwright" }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "+5" }).first()).toBeVisible();
  });

  test("relatórios carregam com o período e exportam CSV", async ({ page }) => {
    await login(page);
    await page.goto("/relatorios");

    await expect(page.getByText("Ordens criadas")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Serviços mais vendidos" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Produtividade por mecânico" })).toBeVisible();

    // Exportar CSV dispara download
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/relatorio-.*\.csv/);
  });

  test("caixa mostra o fechamento diário", async ({ page }) => {
    await login(page);
    await page.goto("/caixa");

    await expect(page.getByText("Total recebido")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Forma de pagamento" })).toBeVisible();
    await expect(page.getByText("PIX")).toBeVisible();
  });

  test("tema escuro é aplicado e persistido", async ({ page }) => {
    await login(page);

    await page.getByRole("button", { name: "Ativar tema escuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.getByRole("button", { name: "Ativar tema claro" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});
