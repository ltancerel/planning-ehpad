import { test, expect } from "@playwright/test";

// Le parcours authentifié (Identité EHPAD, mise à jour réelle) n'est pas
// testé ici : nécessite une session Administrateur d'EHPAD, pas de mot de
// passe réel committé dans le dépôt (cf. e2e/connexion.spec.ts).

test("redirige vers /login quand on visite /admin/ehpad sans session", async ({ page }) => {
  await page.goto("/admin/ehpad");
  await expect(page).toHaveURL(/\/login$/);
});
