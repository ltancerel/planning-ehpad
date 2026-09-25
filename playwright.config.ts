import { defineConfig, devices } from "@playwright/test";

// Chromium est pré-installé dans cet environnement (PLAYWRIGHT_BROWSERS_PATH) ;
// executablePath fonctionne quelle que soit la version de @playwright/test
// installée, sans re-téléchargement — cf. instructions d'environnement.
const CHROMIUM_PATH = "/opt/pw-browsers/chromium";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: CHROMIUM_PATH, args: ["--no-sandbox"] },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
