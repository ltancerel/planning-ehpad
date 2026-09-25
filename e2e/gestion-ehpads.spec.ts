import { test, expect } from "@playwright/test";

// Le parcours de création/suppression lui-même n'est pas testé ici : il
// exige une session Administrateur Système authentifiée, et aucun mot de
// passe réel n'est committé dans le dépôt (cf. e2e/connexion.spec.ts) — à
// vérifier manuellement par le titulaire du compte.

test("redirige vers /login quand on visite /compte/ehpads sans session", async ({ page }) => {
  await page.goto("/compte/ehpads");
  await expect(page).toHaveURL(/\/login$/);
});
