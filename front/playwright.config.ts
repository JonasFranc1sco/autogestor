import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: "./e2e/results",
  use: {
    baseURL: "http://localhost:5173",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    screenshot: "only-on-failure",
    video: "off",
    trace: "off",
    launchOptions: {
      // Navegador Brave (Chromium-based) usado pelo usuário
      executablePath: "/usr/bin/brave-browser",
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
  },
});
