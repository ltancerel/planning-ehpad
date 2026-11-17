import { test, expect } from "@playwright/test";
import { connecterEnTantQue } from "./auth-helpers";

// validation_emargement (src/app/emargement/actions.ts, RLS dans
// 20260924000008_rls.sql) : écriture autorisée pour administrateur ET
// manager, jamais pour utilisateur — et rien, côté UI (EmargementMensuel.tsx),
// ne masque le bouton "Valider la période" pour l'Utilisateur : seule la
// RLS bloque réellement l'écriture. D'où un test qui vérifie l'erreur
// renvoyée, pas juste l'absence du bouton.
//
// Chaque profil valide un mois différent (2031, jamais atteint par les
// données réelles) pour que les 3 tests restent indépendants d'un
// précédent passage de la suite (une période déjà validée changerait
// l'état observé) et les uns des autres en exécution parallèle.

async function validerOuConstaterDejaValidee(page: import("@playwright/test").Page) {
  const boutonValider = page.getByRole("button", { name: "Valider la période" });
  if (await boutonValider.isVisible()) {
    await boutonValider.click();
  }
  // Les deux issues possibles quand l'écriture est autorisée : validation
  // qui réussit, ou période déjà validée par un passage précédent de ce
  // même test — jamais une erreur de droits.
  await expect(page.getByText(/validé par|déjà validée/)).toBeVisible();
}

test("Administrateur peut valider une période d'émargement", async ({ page }) => {
  await connecterEnTantQue(page, "administrateur");
  await page.goto("/emargement?mois=2031-03");
  await validerOuConstaterDejaValidee(page);
});

test("Manager peut valider une période d'émargement", async ({ page }) => {
  await connecterEnTantQue(page, "manager");
  await page.goto("/emargement?mois=2031-04");
  await validerOuConstaterDejaValidee(page);
});

test("Utilisateur ne peut pas valider une période : bloqué par la RLS malgré le bouton visible", async ({
  page,
}) => {
  await connecterEnTantQue(page, "utilisateur");
  await page.goto("/emargement?mois=2031-05");

  const boutonValider = page.getByRole("button", { name: "Valider la période" });
  await expect(boutonValider).toBeVisible();
  await boutonValider.click();

  await expect(page.getByText(/row-level security/i)).toBeVisible();
});
