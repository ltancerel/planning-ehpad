import { test, expect } from "@playwright/test";
import { connecterEnTantQue } from "./auth-helpers";

// Contrôle d'accès réel de la grille Planning (src/components/PlanningGrid.tsx) :
// - Administrateur et Manager peuvent ouvrir le panneau d'édition d'une
//   case (peutEditerPlanning) ; seul l'Administrateur a en plus le
//   cliquer-glisser pour les actions groupées (estAdministrateur), non
//   couvert ici (simulation de drag trop fragile pour peu de valeur
//   ajoutée par rapport au test ci-dessous, qui couvre déjà la régression
//   de droits la plus probable).
// - Utilisateur est strictement lecture seule : aucun gestionnaire de clic
//   sur les cases.

function ligneSalarie(page: import("@playwright/test").Page) {
  // Seules les lignes salarié ont un lien vers l'émargement dans leur
  // première cellule (les lignes d'en-tête de service n'ont qu'une seule
  // cellule fusionnée) — distingue de façon fiable une ligne de données.
  return page.locator("tr").filter({ has: page.locator('a[href*="/emargement?salarie="]') }).first();
}

test.describe("Planning — Administrateur", () => {
  test("peut ouvrir le panneau d'édition d'une case", async ({ page }) => {
    await connecterEnTantQue(page, "administrateur");
    await expect(page).toHaveURL("/");

    const cellule = ligneSalarie(page).locator("td").nth(1);
    await cellule.click();

    await expect(page.getByText("Codes de travail")).toBeVisible();
  });
});

test.describe("Planning — Manager", () => {
  test("peut ouvrir le panneau d'édition d'une case (planning/émargement de son EHPAD)", async ({ page }) => {
    await connecterEnTantQue(page, "manager");
    await expect(page).toHaveURL("/");

    const cellule = ligneSalarie(page).locator("td").nth(1);
    await cellule.click();

    await expect(page.getByText("Codes de travail")).toBeVisible();
  });
});

test.describe("Planning — Utilisateur", () => {
  test("ne peut pas ouvrir le panneau d'édition : lecture seule stricte", async ({ page }) => {
    await connecterEnTantQue(page, "utilisateur");
    await expect(page).toHaveURL("/");

    // Pas de onClick posé sur les cases pour l'Utilisateur (peutEditerPlanning
    // = false) : le clic ne doit rien ouvrir.
    const cellule = ligneSalarie(page).locator("td").nth(1);
    await cellule.click();

    await expect(page.getByText("Codes de travail")).not.toBeVisible();
  });

  test("voit bien le planning de son EHPAD (lecture autorisée par la RLS)", async ({ page }) => {
    await connecterEnTantQue(page, "utilisateur");
    await expect(ligneSalarie(page)).toBeVisible();
  });
});
