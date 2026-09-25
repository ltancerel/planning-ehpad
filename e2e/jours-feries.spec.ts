import { test, expect } from "@playwright/test";

// Retour client du 24/09 : distinguer visuellement les jours fériés des
// week-ends (auparavant même couleur grise) — cf. BACKLOG story #23.
// Jours fériés du jeu de démo (JOURS_FERIES_2026) : 01/11 et 11/11/2026.
//
// Assertions sur les classes CSS plutôt que sur la couleur calculée
// (getComputedStyle) : Tailwind v4 compile ses couleurs en OKLCH, que ce
// Chromium sérialise en lab(...) plutôt qu'en rgb(...) — comparer une
// chaîne rgb() exacte est donc fragile, la classe est un signal plus
// stable.

test.describe("Jours fériés distincts des week-ends", () => {
  test("grille Planning : en-tête ambre sur un jour férié, gris sur un week-end", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /2026 ▾/ }).click();
    await page.locator("input[type=date]").fill("2026-10-26");
    await page.mouse.click(700, 400); // ferme le popover

    // 01/11/2026 est un dimanche ET un jour férié : doit être marqué férié
    // (prioritaire), pas juste gris comme un week-end ordinaire.
    const enTeteFerie = page.locator("th", { hasText: "01/11" });
    await expect(enTeteFerie).toHaveClass(/bg-amber-100/);
    await expect(enTeteFerie).toHaveAttribute("title", "Jour férié");

    // Un week-end sans jour férié (07/11/2026, samedi) reste gris.
    const enTeteWeekend = page.locator("th", { hasText: "07/11" });
    await expect(enTeteWeekend).toHaveClass(/bg-zinc-300/);
    await expect(enTeteWeekend).not.toHaveAttribute("title", "Jour férié");
  });

  test("vue mensuelle Émargement : case ambre sur un jour férié", async ({ page }) => {
    // mois=2026-10 -> fenêtre par défaut 12/10-08/11/2026 (lundi le plus
    // proche du 15/10), qui couvre le jour férié du 01/11.
    await page.goto("/emargement?mois=2026-10");
    const caseFerie = page.locator("td", { has: page.getByText("01/11", { exact: true }) });
    await expect(caseFerie).toHaveClass(/bg-amber-50/);
  });
});
