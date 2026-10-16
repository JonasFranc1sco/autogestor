import { test, expect } from "@playwright/test";
import { login, selectOptionByText } from "./helpers";

test.describe("Ordem de serviço", () => {
  test("ciclo completo: criar com peça, status, pagamento e impressão", async ({ page }) => {
    await login(page);
    await page.goto("/os");

    // Criar OS
    await page.getByRole("button", { name: "Nova OS" }).click();
    await selectOptionByText(page, "Cliente", "João Silva");
    await selectOptionByText(page, "Veículo", "BRA2E19");
    await page.getByLabel(/^Descrição/).fill("Revisão completa Playwright");

    // Adicionar peça (baixa de estoque automática)
    await page.getByRole("button", { name: "Adicionar peça" }).click();
    await selectOptionByText(page, "Produto", "Filtro de Óleo");
    await page.getByLabel(/^Qtd\./).fill("2");

    // Resumo financeiro mostra o total
    await expect(page.getByText("R$ 80,00").first()).toBeVisible();

    await page.getByRole("button", { name: "Criar OS" }).click();
    await expect(page.getByText(/OS #\d+ criada com sucesso/)).toBeVisible();

    // Abrir a OS criada (primeira da lista = mais recente)
    await page.locator("tbody tr").first().click();
    await expect(page.getByRole("heading", { name: /OS #\d+/ })).toBeVisible();
    await expect(page.getByText("Revisão completa Playwright")).toBeVisible();

    // Baixa de estoque registrada na OS
    await expect(page.getByText("Filtro de Óleo")).toBeVisible();

    // Transições de status: OPEN -> IN_PROGRESS -> DONE
    await page.getByRole("button", { name: "Iniciar atendimento" }).click();
    await expect(page.getByText("Status atualizado para \"Em andamento\"")).toBeVisible();
    await page.getByRole("button", { name: "Concluir OS" }).click();
    await expect(page.getByText("Status atualizado para \"Concluída\"")).toBeVisible();

    // Pagamento
    await page.getByRole("button", { name: "Registrar pagamento" }).click();
    await page.getByLabel(/^Forma\ de\ pagamento/).selectOption("PIX");
    await page.getByLabel(/^Valor\ \(R\$\)/).fill("80,00");
    await page.getByRole("button", { name: "Registrar" }).last().click();
    await expect(page.getByText("Pagamento registrado com sucesso")).toBeVisible();
    await expect(page.getByText("PIX").first()).toBeVisible();

    // Timeline registrou eventos
    await expect(page.getByText("Histórico")).toBeVisible();

    // Página de impressão acessível
    await page.getByRole("link", { name: "Imprimir" }).click();
    await expect(page.getByRole("button", { name: "Imprimir" })).toBeVisible();
    await expect(page.getByText("Assinatura do cliente")).toBeVisible();
    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(page.getByRole("heading", { name: /OS #\d+/ })).toBeVisible();
  });

  test("estoque é devolvido ao cancelar a OS", async ({ page }) => {
    await login(page);

    // Verificar estoque atual do Filtro de Óleo
    await page.goto("/produtos");
    await page.getByLabel(/Buscar por nome/).fill("Filtro de Óleo");
    const stockBefore = await page.getByRole("cell", { name: /\d+ un\./ }).first().innerText();

    // Criar OS com 1 peça
    await page.goto("/os");
    await page.getByRole("button", { name: "Nova OS" }).click();
    await selectOptionByText(page, "Cliente", "João Silva");
    await selectOptionByText(page, "Veículo", "BRA2E19");
    await page.getByRole("button", { name: "Adicionar peça" }).click();
    await selectOptionByText(page, "Produto", "Filtro de Óleo");
    await page.getByRole("button", { name: "Criar OS" }).click();
    await expect(page.getByText(/OS #\d+ criada com sucesso/)).toBeVisible();

    // Estoque diminuiu
    await page.goto("/produtos");
    await page.getByLabel(/Buscar por nome/).fill("Filtro de Óleo");
    await expect(page.getByRole("cell", { name: /\d+ un\./ }).first()).not.toHaveText(stockBefore);

    // Abrir a OS recém-criada (primeira da lista) e cancelar
    await page.goto("/os");
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 15_000 });
    await page.locator("tbody tr").first().click();
    await page.getByRole("button", { name: "Cancelar OS" }).click();
    await page.getByRole("button", { name: "Cancelar OS" }).last().click();
    await expect(page.getByText("Status atualizado para \"Cancelada\"")).toBeVisible();

    // Estoque devolvido
    await page.goto("/produtos");
    await page.getByLabel(/Buscar por nome/).fill("Filtro de Óleo");
    await expect(page.getByRole("cell", { name: /\d+ un\./ }).first()).toHaveText(stockBefore);
  });

  test("transição de status inválida não é permitida", async ({ page }) => {
    await login(page);
    await page.goto("/os");

    // Nova OS sem itens
    await page.getByRole("button", { name: "Nova OS" }).click();
    await selectOptionByText(page, "Cliente", "João Silva");
    await selectOptionByText(page, "Veículo", "BRA2E19");
    await page.getByRole("button", { name: "Criar OS" }).click();
    await expect(page.getByText(/OS #\d+ criada com sucesso/)).toBeVisible();

    await page.locator("tbody tr").first().click();
    // De OPEN não há botão "Concluir OS" — apenas transições válidas
    await expect(page.getByRole("button", { name: "Concluir OS" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Iniciar atendimento" })).toBeVisible();
  });
});
