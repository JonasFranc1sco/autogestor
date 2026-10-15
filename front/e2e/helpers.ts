import { expect, type Page } from "@playwright/test";

export const DEMO_EMAIL = "admin@demo.com";
export const DEMO_PASSWORD = "senhaForte123";

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(DEMO_EMAIL);
  await page.getByLabel("Senha").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Olá|Bom dia|Boa tarde|Boa noite/)).toBeVisible();
}


export async function selectOptionByText(
  page: import("@playwright/test").Page,
  label: string,
  optionText: string,
) {
  const select = page.getByLabel(label, { exact: true });
  const option = select.locator("option", { hasText: optionText }).first();
  const value = await option.getAttribute("value");
  await select.selectOption(value!);
}
