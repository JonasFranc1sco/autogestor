import { test, expect } from "@playwright/test";
import { login, selectOptionByText } from "./helpers";

test.describe("Orçamento (Volátil / Sem Persistência)", () => {
  test("monta orçamento com cliente/veículo opcionais, calcula totais e limpa tudo após imprimir/PDF", async ({
    page,
  }) => {
    await login(page);

    // Navegar pela Sidebar para a aba de Orçamento
    await page.getByRole("link", { name: "Orçamento" }).click();
    await expect(page.getByRole("heading", { name: "Orçamento" })).toBeVisible();

    // Selecionar Cliente e Veículo opcionais
    await selectOptionByText(page, "Cliente", "João Silva");
    await selectOptionByText(page, "Veículo", "BRA2E19");

    // Preencher serviço livre
    await page.getByLabel("Descrição do serviço").first().fill("Alinhamento e balanceamento 3D");
    await page.getByLabel("Valor Unit. (R$)").first().fill("120,00");

    // Adicionar mais um serviço
    await page.getByRole("button", { name: "Adicionar serviço" }).click();
    await page.getByLabel("Descrição do serviço").nth(1).fill("Limpeza de bicos injetores");
    await page.getByLabel("Valor Unit. (R$)").nth(1).fill("180,00");

    // Preencher peça livre com quantidade > 1
    await page.getByLabel("Descrição da peça").first().fill(" Jogo de velas NGK");
    await page.getByLabel("Qtd.").nth(2).fill("2");
    await page.getByLabel("Valor Unit. (R$)").nth(2).fill("95,00");

    // Verificar subtotais e total geral:
    // Serviços: 120 + 180 = R$ 300,00
    // Peças: 2 * 95 = R$ 190,00
    // Total Geral: R$ 490,00
    await expect(page.getByText("R$ 300,00").first()).toBeVisible();
    await expect(page.getByText("R$ 190,00").first()).toBeVisible();
    await expect(page.getByText("R$ 490,00").first()).toBeVisible();

    // Interceptar window.print() para disparar afterprint como o navegador faz ao fechar o diálogo de PDF/Impressão
    await page.evaluate(() => {
      window.print = () => {
        window.dispatchEvent(new Event("afterprint"));
      };
    });

    await page
      .getByRole("button", { name: "Imprimir / Salvar em PDF" })
      .first()
      .click();

    // Modal de finalização aparece
    const dialog = page.getByRole("dialog", { name: "Orçamento finalizado" });
    await expect(dialog).toBeVisible();

    // Testar "Continuar editando": deve manter os dados anteriores intactos
    await dialog.getByRole("button", { name: "Continuar editando" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByLabel("Descrição do serviço").first()).toHaveValue("Alinhamento e balanceamento 3D");
    await expect(page.getByText("R$ 490,00").first()).toBeVisible();

    // Imprimir novamente e escolher "Novo Orçamento" para limpar os dados
    await page
      .getByRole("button", { name: "Imprimir / Salvar em PDF" })
      .first()
      .click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Novo Orçamento" }).click();
    await expect(dialog).toHaveCount(0);

    await expect(page.getByLabel("Descrição do serviço")).toHaveCount(1);
    await expect(page.getByLabel("Descrição do serviço").first()).toHaveValue("");
    await expect(page.getByLabel("Descrição da peça").first()).toHaveValue("");
    await expect(page.getByText("R$ 0,00").first()).toBeVisible();
  });
});
