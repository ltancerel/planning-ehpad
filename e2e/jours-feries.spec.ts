import { test, expect } from "@playwright/test";

// Retour client du 24/09 : distinguer visuellement les jours fériés des
// week-ends (auparavant même couleur grise) — cf. BACKLOG story #23.
// Jours fériés du jeu de démo (JOURS_FERIES_2026) : 01/11 et 11/11/2026.
//
// Le test sur la grille Planning (en-tête d'un jour férié) a été retiré le
// 25/09 : / exige désormais une session réelle (story #35, données
// réelles), pas de mot de passe committé dans le dépôt — déplacé dans
// STAGING_CHECKLIST.md. Le test sur l'Émargement reste ici, cet écran
// n'étant pas encore branché sur le backend (donc pas encore protégé).

test("vue mensuelle Émargement : case ambre sur un jour férié", async ({ page }) => {
  // mois=2026-10 -> fenêtre par défaut 12/10-08/11/2026 (lundi le plus
  // proche du 15/10), qui couvre le jour férié du 01/11.
  await page.goto("/emargement?mois=2026-10");
  const caseFerie = page.locator("td", { has: page.getByText("01/11", { exact: true }) });
  await expect(caseFerie).toHaveClass(/bg-amber-50/);
});
