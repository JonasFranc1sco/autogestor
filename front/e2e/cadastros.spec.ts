import { test, expect } from "@playwright/test";
import { login, selectOptionByText } from "./helpers";

test.describe("Cadastros", () => {
  test("criar, buscar e excluir cliente", async ({ page }) => {
    await login(page);
    await page.goto("/clientes");

    const nome = `Cliente Playwright ${Date.now()}`;

    // Criar
    await page.getByRole("button", { name: "Novo Cliente" }).click();
    await page.getByLabel(/^Nome/).fill(nome);
    await page.getByLabel(/^Telefone/).fill("(62) 98888-7777");
    await page.getByRole("button", { name: "Cadastrar" }).click();
    await expect(page.getByText("Cliente cadastrado com sucesso")).toBeVisible();

    // Buscar
    await page.getByLabel(/Buscar por nome/).fill(nome);
    await expect(page.getByRole("cell", { name: nome, exact: true })).toBeVisible();

    // Editar
    await page.getByRole("button", { name: `Editar ${nome}` }).click();
    await page.getByLabel(/^Nome/).fill(`${nome} Editado`);
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Cliente atualizado com sucesso")).toBeVisible();
    await expect(page.getByRole("cell", { name: `${nome} Editado`, exact: true })).toBeVisible();

    // Excluir (soft delete)
    await page.getByRole("button", { name: `Remover ${nome} Editado` }).click();
    await page.getByRole("button", { name: "Remover" }).last().click();
    await expect(page.getByText("Cliente removido com sucesso")).toBeVisible();
    await expect(page.getByText("Nenhum cliente encontrado")).toBeVisible();
  });

  test("placa inválida de veículo é bloqueada com mensagem", async ({ page }) => {
    await login(page);
    await page.goto("/veiculos");

    await page.getByRole("button", { name: "Novo Veículo" }).click();
    await page.getByLabel(/^Proprietário/).selectOption({ label: "João Silva" });
    await page.getByLabel(/^Placa/).fill("1234ABC");
    await page.getByLabel(/^Marca/).fill("Fiat");
    await page.getByLabel(/^Modelo/).fill("Uno");
    await page.getByRole("button", { name: "Cadastrar" }).click();

    await expect(page.getByText("Use o formato ABC1234 ou ABC1D23")).toBeVisible();
  });

  test("produto aparece na lista com estoque formatado", async ({ page }) => {
    await login(page);
    await page.goto("/produtos");

    const produto = `Pastilha de Freio ${Date.now()}`;
    await page.getByRole("button", { name: "Novo Produto" }).click();
    await page.getByLabel(/^Nome/).fill(produto);
    await page.getByLabel(/^Preço\ de\ custo\ \(R\$\)/).fill("30,00");
    await page.getByLabel(/^Preço\ de\ venda\ \(R\$\)/).fill("60,00");
    await page.getByLabel(/^Estoque\ atual/).fill("8");
    await page.getByRole("button", { name: "Cadastrar" }).click();
    await expect(page.getByText("Produto cadastrado com sucesso")).toBeVisible();

    const row = page.getByRole("row").filter({ hasText: produto });
    await expect(row.getByRole("cell", { name: produto, exact: true })).toBeVisible();
    await expect(row.getByText("R$ 60,00")).toBeVisible();
    await expect(row.getByText("8 un.")).toBeVisible();
  });
});
