import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

// Chromium est pré-installé dans l'environnement cloud Claude Code
// (PLAYWRIGHT_BROWSERS_PATH). Sur un autre poste (ex. le serveur de
// non-régression), ce chemin n'existe pas : Playwright utilise alors son
// propre Chromium, installé via `npx playwright install chromium`.
const CHROMIUM_PATH = "/opt/pw-browsers/chromium";
const executablePath = existsSync(CHROMIUM_PATH) ? CHROMIUM_PATH : undefined;

// Cible par défaut : le serveur de dev local, démarré automatiquement par
// le bloc webServer ci-dessous. Pour lancer les tests contre un
// déploiement déjà en ligne (ex. STAGING), définir PLAYWRIGHT_BASE_URL —
// le serveur de dev local n'est alors pas démarré, les tests tapent
// directement sur cette URL distante.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: executablePath ? { executablePath, args: ["--no-sandbox"] } : {},
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
