import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("API de CEP", () => {
  test("CEP preenche o endereço automaticamente", async ({ page }) => {
    await page.route("**/api/utils/cep/**", (route) =>
      route.fulfill({
        json: {
          cep: "01310100",
          street: "Avenida Paulista",
          neighborhood: "Bela Vista",
          city: "São Paulo",
          state: "SP",
        },
      }),
    );

    await login(page);
    await page.goto("/clientes");
    await page.getByRole("button", { name: "Novo Cliente" }).click();

    const dialog = page.getByRole("dialog", { name: "Novo Cliente" });
    await dialog.getByLabel(/^CEP/).fill("01310100");

    await expect(dialog.getByLabel(/^Rua/)).toHaveValue("Avenida Paulista");
    await expect(dialog.getByLabel(/^Bairro/)).toHaveValue("Bela Vista");
    await expect(dialog.getByLabel(/^Cidade/)).toHaveValue("São Paulo");
    await expect(dialog.getByLabel(/^Estado/)).toHaveValue("SP");
    await expect(page.getByText("Endereço preenchido pelo CEP")).toBeVisible();
  });

  test("CEP não encontrado mostra aviso e permite preencher manualmente", async ({ page }) => {
    await page.route("**/api/utils/cep/**", (route) =>
      route.fulfill({ status: 404, json: { detail: "CEP não encontrado." } }),
    );

    await login(page);
    await page.goto("/clientes");
    await page.getByRole("button", { name: "Novo Cliente" }).click();

    const dialog = page.getByRole("dialog", { name: "Novo Cliente" });
    await dialog.getByLabel(/^CEP/).fill("99999999");

    await expect(page.getByText("CEP não encontrado")).toBeVisible();
    await expect(dialog.getByLabel(/^Rua/)).toHaveValue("");
  });
});
