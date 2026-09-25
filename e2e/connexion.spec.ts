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

test("redirige vers /login quand on visite / (Planning) sans session", async ({ page }) => {
  // Depuis le 25/09, la grille Planning est branchée sur les vraies données
  // (salariés/services réels de l'EHPAD, story #35 démarrée) — nécessite
  // donc une session comme /compte et /admin.
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("redirige vers /login quand on visite /emargement sans session", async ({ page }) => {
  // Depuis le 25/09, l'Émargement est branché sur les vraies données
  // (salarié, jours fériés et validations réels de l'EHPAD) — nécessite
  // donc une session comme /, /compte et /admin.
  await page.goto("/emargement");
  await expect(page).toHaveURL(/\/login$/);
});

test("email inconnu : message générique, reste sur /login", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "email-qui-nexiste-pas@test.local");
  await page.fill("#mot_de_passe", "peu-importe");
  await page.click("button[type=submit]");

  await expect(page.getByRole("alert").filter({ hasText: "incorrect" })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("email valide, mauvais mot de passe : même message générique (pas d'énumération)", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill("#email", "ludovic.tancerel@aiot-conseil.fr");
  await page.fill("#mot_de_passe", "mot-de-passe-volontairement-faux");
  await page.click("button[type=submit]");

  await expect(page.getByRole("alert").filter({ hasText: "incorrect" })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
