import { test, expect } from "@playwright/test";
import { login, selectOptionByText } from "./helpers";

test.describe("Busca em selects e atalhos de criação", () => {
  test("issue #20: select de cliente filtra resultados e mostra mensagem de vazio", async ({ page }) => {
    await login(page);
    await page.goto("/os");
    await page.getByRole("button", { name: "Nova OS" }).click();

    const clienteInput = page.getByLabel(/^Cliente/);
    await clienteInput.click();
    await clienteInput.fill("zzznadaexiste");

    await expect(page.getByText("Nenhum resultado encontrado")).toBeVisible();

    await clienteInput.fill("João");
    await expect(page.getByRole("option", { name: /João/ }).first()).toBeVisible();
    await page.getByRole("option", { name: /João/ }).first().click();

    // seleção preenche o campo
    await expect(clienteInput).toHaveValue(/João/);
  });

  test("issue #20: select de veículo filtra por placa", async ({ page }) => {
    await login(page);
    await page.goto("/os");
    await page.getByRole("button", { name: "Nova OS" }).click();

    await selectOptionByText(page, "Cliente", "João Silva");

    const veiculoInput = page.getByLabel(/^Veículo/);
    await veiculoInput.click();
    await veiculoInput.fill("BRA");

    await expect(page.getByRole("option", { name: /BRA2E19/ }).first()).toBeVisible();
    await page.getByRole("option", { name: /BRA2E19/ }).first().click();
    await expect(veiculoInput).toHaveValue(/BRA2E19/);
  });

  test("issue #21: atalho por linha cadastra veículo já vinculado ao cliente", async ({ page }) => {
    await login(page);
    await page.goto("/clientes");

    // Atalho na linha do cliente João Silva
    await page.getByRole("button", { name: "Cadastrar veículo para João Silva" }).click();
    const veiculoDialog = page.getByRole("dialog", { name: "Novo Veículo" });
    await expect(veiculoDialog).toBeVisible();

    // Dono vem pré-preenchido e não pode ser alterado acidentalmente
    await expect(veiculoDialog.getByLabel(/^Proprietário/)).toHaveValue("João Silva");

    const placa = `ABC${Math.floor(1000 + Math.random() * 9000)}`;
    await veiculoDialog.getByLabel(/^Placa/).fill(placa);
    await veiculoDialog.getByLabel(/^Marca/).fill("Toyota");
    await veiculoDialog.getByLabel(/^Modelo/).fill("Corolla");
    await veiculoDialog.getByRole("button", { name: "Cadastrar", exact: true }).click();
    await expect(page.getByText("Veículo cadastrado com sucesso")).toBeVisible();

    // Vínculo cliente-veículo confirmado na tela de veículos
    await page.goto("/veiculos");
    await page.getByLabel(/Buscar por placa/).fill(placa);
    await expect(page.getByRole("cell", { name: placa, exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "João Silva" }).first()).toBeVisible();
  });

  test("issue #21: atalho na OS cria cliente e seleciona automaticamente", async ({ page }) => {
    await login(page);
    await page.goto("/os");
    await page.getByRole("button", { name: "Nova OS" }).click();

    // Atalho "+" ao lado do select de cliente
    await page.getByRole("button", { name: "Novo cliente" }).click();
    await expect(page.getByRole("dialog", { name: "Novo Cliente" })).toBeVisible();

    const nome = `Cliente Atalho ${Date.now()}`;
    const clienteDialog = page.getByRole("dialog", { name: "Novo Cliente" });
    await clienteDialog.getByLabel(/^Nome/).fill(nome);
    await clienteDialog.getByRole("button", { name: "Cadastrar", exact: true }).click();
    await expect(page.getByText("Cliente cadastrado com sucesso")).toBeVisible();

    // Modal fecha e o novo cliente fica selecionado no formulário da OS
    await expect(page.getByRole("dialog", { name: "Nova Ordem de Serviço" })).toBeVisible();
    await expect(page.getByLabel(/^Cliente/)).toHaveValue(nome);
  });

  test("issue #21: atalho na OS cria produto e preenche a linha de peça", async ({ page }) => {
    await login(page);
    await page.goto("/os");
    await page.getByRole("button", { name: "Nova OS" }).click();

    await page.getByRole("button", { name: "Adicionar peça" }).click();
    await page.getByRole("button", { name: "Novo produto" }).first().click();
    await expect(page.getByRole("dialog", { name: "Novo Produto" })).toBeVisible();

    const produto = `Produto Atalho ${Date.now()}`;
    const produtoDialog = page.getByRole("dialog", { name: "Novo Produto" });
    await produtoDialog.getByLabel(/^Nome/).fill(produto);
    await produtoDialog.getByLabel(/^Preço\ de\ custo/).fill("10,00");
    await produtoDialog.getByLabel(/^Preço\ de\ venda/).fill("25,00");
    await produtoDialog.getByRole("button", { name: "Cadastrar", exact: true }).click();
    await expect(page.getByText("Produto cadastrado com sucesso")).toBeVisible();

    // Linha de peça preenchida com o produto recém-criado
    await expect(page.getByRole("dialog", { name: "Nova Ordem de Serviço" })).toBeVisible();
    await expect(page.getByLabel(/^Produto/)).toHaveValue(produto);
  });
});
