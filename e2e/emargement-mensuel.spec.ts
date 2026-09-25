import { test, expect } from "@playwright/test";

// Retour client du 24/09 : vue mensuelle Émargement configurable 4 ou 6
// semaines, entièrement visible, navigation semaine par semaine, départ
// par défaut au lundi le plus proche du milieu du mois — cf. BACKLOG
// story #25. 15/09/2026 est un mardi : lundi le plus proche = 14/09.

test.describe("Vue mensuelle Émargement — 4 ou 6 semaines", () => {
  test("départ par défaut : lundi le plus proche du milieu du mois (mois=2026-09 -> 14/09)", async ({ page }) => {
    await page.goto("/emargement?mois=2026-09");
    await expect(page.locator("span.font-semibold").first()).toHaveText("14/09 – 11/10 2026");
  });

  test("bascule vers 6 semaines : garde le même départ, prolonge la fin", async ({ page }) => {
    await page.goto("/emargement?mois=2026-09");
    await page.getByRole("button", { name: "6 semaines" }).click();
    await expect(page.locator("span.font-semibold").first()).toHaveText("14/09 – 25/10 2026");
    // 6 semaines = 42 jours = 6 lignes complètes, sans ascenseur (toutes visibles)
    await expect(page.locator("tbody tr")).toHaveCount(6);
  });

  test("navigation semaine par semaine (2 clics = +2 semaines)", async ({ page }) => {
    await page.goto("/emargement?mois=2026-09");
    await page.getByRole("button", { name: "6 semaines" }).click();
    const label = page.locator("span.font-semibold").first();
    await expect(label).toHaveText("14/09 – 25/10 2026");
    await page.getByRole("button", { name: "Semaine suivante →" }).click();
    await expect(label).toHaveText("21/09 – 01/11 2026");
    await page.getByRole("button", { name: "Semaine suivante →" }).click();
    await expect(label).toHaveText("28/09 – 08/11 2026");
  });

  test("le lundi est toujours en première colonne", async ({ page }) => {
    await page.goto("/emargement?mois=2026-09");
    await expect(page.locator("thead th").first()).toHaveText("L");
  });
});
