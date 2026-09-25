import { test, expect } from "@playwright/test";

// Ces scénarios tapent réellement sur Supabase Auth PROD (pas d'environnement
// de DEV pour l'instant, cf. AGENTS.md). Volontairement limités aux chemins
// d'échec : aucun mot de passe réel n'est committé dans le dépôt, donc le
// parcours de connexion réussie n'est pas couvert ici — seul le titulaire du
// compte Administrateur Système le vérifie manuellement.
// Nécessite NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
// dans l'environnement (.env.local en local).

test("redirige vers /login quand on visite /compte sans session", async ({ page }) => {
  await page.goto("/compte");
  await expect(page).toHaveURL(/\/login$/);
});

test("identifiant inconnu : message générique, reste sur /login", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#identifiant", "identifiant-qui-nexiste-pas");
  await page.fill("#mot_de_passe", "peu-importe");
  await page.click("button[type=submit]");

  await expect(page.getByRole("alert").filter({ hasText: "incorrect" })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("identifiant valide, mauvais mot de passe : même message générique (pas d'énumération)", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill("#identifiant", "ltancerel");
  await page.fill("#mot_de_passe", "mot-de-passe-volontairement-faux");
  await page.click("button[type=submit]");

  await expect(page.getByRole("alert").filter({ hasText: "incorrect" })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
