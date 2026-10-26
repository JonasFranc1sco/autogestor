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
    await selectOptionByText(page, "Proprietário", "João Silva");
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

  test("issue #22: paginação numérica navega entre páginas e reseta ao buscar", async ({ page }) => {
    const mockedClients = Array.from({ length: 25 }, (_, index) => ({
      id: `client-${index + 1}`,
      person_type: "PF",
      name: `Cliente Paginado ${String(index + 1).padStart(2, "0")}`,
      phone: "+5562999990000",
      email: `cliente${index + 1}@teste.com`,
      address: null,
      document: null,
      responsible: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    await page.route("**/api/clients/**", async (route) => {
      const url = new URL(route.request().url());
      const currentPage = Number(url.searchParams.get("page") ?? "1");
      const pageSize = Number(url.searchParams.get("page_size") ?? "10");
      const search = (url.searchParams.get("search") ?? "").toLowerCase();

      const filtered = search
        ? mockedClients.filter((item) => item.name.toLowerCase().includes(search))
        : mockedClients;
      const start = (currentPage - 1) * pageSize;
      const results = filtered.slice(start, start + pageSize);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: filtered.length,
          next: start + pageSize < filtered.length ? `?page=${currentPage + 1}` : null,
          previous: currentPage > 1 ? `?page=${currentPage - 1}` : null,
          results,
        }),
      });
    });

    await login(page);
    await page.goto("/clientes");

    const pagination = page.getByRole("navigation", { name: "Paginação" });
    await expect(pagination).toBeVisible();
    await expect(pagination.getByText(/Exibindo 1–10 de 25 cliente\(s\)/)).toBeVisible();

    const prevButton = pagination.getByRole("button", { name: "Página anterior" });
    const nextButton = pagination.getByRole("button", { name: "Próxima página" });
    const page1Button = pagination.getByRole("button", { name: "Página 1" });
    const page2Button = pagination.getByRole("button", { name: "Página 2" });
    const page3Button = pagination.getByRole("button", { name: "Página 3" });

    await expect(prevButton).toBeDisabled();
    await expect(nextButton).toBeEnabled();
    await expect(page1Button).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("cell", { name: "Cliente Paginado 01", exact: true })).toBeVisible();

    // Navegar diretamente clicando no número da página 2
    await page2Button.click();
    await expect(page2Button).toHaveAttribute("aria-current", "page");
    await expect(prevButton).toBeEnabled();
    await expect(page.getByRole("cell", { name: "Cliente Paginado 11", exact: true })).toBeVisible();

    // Avançar para a última página (página 3)
    await nextButton.click();
    await expect(page3Button).toHaveAttribute("aria-current", "page");
    await expect(nextButton).toBeDisabled();
    await expect(page.getByRole("cell", { name: "Cliente Paginado 25", exact: true })).toBeVisible();

    // Buscar altera o filtro e retorna automaticamente para a página 1
    await page.getByLabel(/Buscar por nome/).fill("Cliente Paginado 02");
    await expect(page1Button).toHaveAttribute("aria-current", "page");
    await expect(prevButton).toBeDisabled();
    await expect(nextButton).toBeDisabled();
    await expect(page.getByRole("cell", { name: "Cliente Paginado 02", exact: true })).toBeVisible();
  });
});
