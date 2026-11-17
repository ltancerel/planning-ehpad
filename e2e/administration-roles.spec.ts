import { test, expect } from "@playwright/test";
import { connecterEnTantQue } from "./auth-helpers";
import { champParLabel } from "./form-helpers";

// Administration (src/app/admin/layout.tsx, src/app/compte/layout.tsx) :
// /admin/* est réservé au type_compte "administrateur" (Manager et
// Utilisateur tombent sur le même écran "accès réservé", sans
// redirection — ce n'est pas une 404/redirect/login mais un contenu
// différent sous la même URL, donc on vérifie le texte affiché, pas
// l'URL). /compte/* est réservé à l'administrateur_systeme : aucun des 3
// comptes de test n'y a accès, y compris l'Administrateur d'EHPAD.

const MESSAGE_RESERVE_ADMIN = "Cette zone est réservée au rôle Administrateur";
const MESSAGE_RESERVE_ADMIN_SYSTEME = "réservée à l'Administrateur Système";

// "Identifiant" : exactement 3 lettres majuscules (contrainte du
// formulaire) — pas de place pour un suffixe horodaté comme pour
// matricule/nom. Dérivé du timestamp courant pour limiter (sans
// l'éliminer) le risque de collision avec un identifiant déjà pris en
// base, plutôt qu'une valeur fixe qui échouerait dès le 2e passage si le
// nettoyage d'un run précédent n'a pas eu lieu.
function identifiantAleatoire(): string {
  let n = Date.now() % 26 ** 3;
  const lettres: string[] = [];
  for (let i = 0; i < 3; i++) {
    lettres.unshift(String.fromCharCode(65 + (n % 26)));
    n = Math.floor(n / 26);
  }
  return lettres.join("");
}

test.describe("Administration — Administrateur", () => {
  test("accède à l'espace Administration de son EHPAD", async ({ page }) => {
    await connecterEnTantQue(page, "administrateur");
    await page.goto("/admin/salaries");
    await expect(page.getByText(MESSAGE_RESERVE_ADMIN)).not.toBeVisible();
    await expect(page.getByRole("button", { name: "+ Nouveau salarié" })).toBeVisible();
  });

  test("n'a pas accès à /compte/ehpads, réservé à l'Administrateur Système", async ({ page }) => {
    await connecterEnTantQue(page, "administrateur");
    await page.goto("/compte/ehpads");
    await expect(page.getByText(MESSAGE_RESERVE_ADMIN_SYSTEME)).toBeVisible();
  });

  test("peut créer puis supprimer un salarié", async ({ page }) => {
    await connecterEnTantQue(page, "administrateur");
    await page.goto("/admin/salaries");

    const suffixe = Date.now().toString().slice(-6);
    const nom = `E2ETest${suffixe}`;
    const matricule = `E${suffixe.slice(-4)}`;

    await page.getByRole("button", { name: "+ Nouveau salarié" }).click();
    await champParLabel(page, "Matricule (2 à 5 caractères)").fill(matricule);
    await champParLabel(page, "Nom").fill(nom);
    await champParLabel(page, "Prénom").fill("Playwright");
    await page.getByRole("button", { name: "Créer" }).click();

    const ligne = page.locator("tr", { hasText: nom });
    await expect(ligne).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await ligne.getByRole("button", { name: "Supprimer" }).click();
    await expect(ligne).not.toBeVisible();
  });

  test("peut créer un utilisateur (adresse fictive uniquement — jamais une adresse réelle de l'EHPAD, cf. inviteUserByEmail)", async ({
    page,
  }) => {
    await connecterEnTantQue(page, "administrateur");
    await page.goto("/admin/utilisateurs");

    const suffixe = Date.now().toString().slice(-6);
    const identifiant = identifiantAleatoire();
    const emailFictif = `playwright-e2e-${suffixe}@example.invalid`;
    const nom = `E2EUtilisateur${suffixe}`;

    await page.getByRole("button", { name: "+ Nouvel utilisateur" }).click();
    await champParLabel(page, "Identifiant (3 lettres majuscules)").fill(identifiant);
    await champParLabel(page, "Nom").fill(nom);
    await champParLabel(page, "Prénom").fill("Playwright");
    await champParLabel(page, "Email").fill(emailFictif);
    await page.getByRole("button", { name: "Créer" }).click();

    await expect(page.getByText(new RegExp(`envoyé à ${emailFictif}`))).toBeVisible();

    const ligne = page.locator("tr", { hasText: nom });
    page.once("dialog", (dialog) => dialog.accept());
    await ligne.getByRole("button", { name: "Supprimer" }).click();
    await expect(ligne).not.toBeVisible();
  });
});

test.describe("Administration — Manager", () => {
  test("n'a pas accès à /admin/*", async ({ page }) => {
    await connecterEnTantQue(page, "manager");
    await page.goto("/admin/salaries");
    await expect(page.getByText(MESSAGE_RESERVE_ADMIN)).toBeVisible();
  });

  test("n'a pas accès à /compte", async ({ page }) => {
    await connecterEnTantQue(page, "manager");
    await page.goto("/compte");
    await expect(page.getByText(MESSAGE_RESERVE_ADMIN_SYSTEME)).toBeVisible();
  });
});

test.describe("Administration — Utilisateur", () => {
  test("n'a pas accès à /admin/*", async ({ page }) => {
    await connecterEnTantQue(page, "utilisateur");
    await page.goto("/admin/salaries");
    await expect(page.getByText(MESSAGE_RESERVE_ADMIN)).toBeVisible();
  });

  test("n'a pas accès à /compte", async ({ page }) => {
    await connecterEnTantQue(page, "utilisateur");
    await page.goto("/compte");
    await expect(page.getByText(MESSAGE_RESERVE_ADMIN_SYSTEME)).toBeVisible();
  });
});
