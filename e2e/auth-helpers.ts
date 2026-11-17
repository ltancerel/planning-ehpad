import { type Page, test } from "@playwright/test";

// Les 3 profils de test tournent sur le projet Supabase STAGING (copie
// anonymisée de PROD, cf. doc non-régression) — jamais d'identifiants en
// dur dans le code, toujours lus depuis l'environnement du poste qui
// lance les tests (.env.e2e sur le serveur de non-régression).
export type Profil = "administrateur" | "manager" | "utilisateur";

const VARIABLES_PAR_PROFIL: Record<Profil, { email: string; motDePasse: string }> = {
  administrateur: { email: "E2E_ADMIN_EMAIL", motDePasse: "E2E_ADMIN_PASSWORD" },
  manager: { email: "E2E_MANAGER_EMAIL", motDePasse: "E2E_MANAGER_PASSWORD" },
  utilisateur: { email: "E2E_USER_EMAIL", motDePasse: "E2E_USER_PASSWORD" },
};

/**
 * Lit les identifiants d'un profil depuis l'environnement. Si absents
 * (ex. suite lancée localement sans .env.e2e), skip le test au lieu de le
 * faire échouer — la suite reste utilisable sans ces 3 comptes configurés.
 */
export function identifiants(profil: Profil): { email: string; motDePasse: string } {
  const { email: cleEmail, motDePasse: cleMotDePasse } = VARIABLES_PAR_PROFIL[profil];
  const email = process.env[cleEmail];
  const motDePasse = process.env[cleMotDePasse];
  if (!email || !motDePasse) {
    test.skip(true, `Variables ${cleEmail}/${cleMotDePasse} absentes de l'environnement — test ignoré.`);
  }
  return { email: email!, motDePasse: motDePasse! };
}

/** Remplit le formulaire de connexion et attend la redirection post-login. */
export async function connecterEnTantQue(page: Page, profil: Profil): Promise<void> {
  const { email, motDePasse } = identifiants(profil);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
  // Administrateur d'EHPAD/Manager/Utilisateur atterrissent sur le Planning
  // ("/"), jamais sur /compte (réservé à l'Administrateur Système) — cf.
  // src/app/login/actions.ts.
  await page.waitForURL((url) => url.pathname !== "/login", { timeout: 15_000 });
}
