import { test, expect } from "@playwright/test";
import { connecterEnTantQue } from "./auth-helpers";

// Retour client du 19/11 : le filtre avancé du Planning se perdait en
// naviguant vers l'émargement d'un salarié ou l'Administration puis en
// revenant au Planning (remontage complet du composant côté client, l'état
// React seul ne survit pas à une navigation) — corrigé en mémorisant le
// filtre dans localStorage, comme la période déjà affichée (CLE_STOCKAGE_PERIODE).
//
// La persistance se fait directement dans le gestionnaire de changement
// (changerFiltres, PlanningGrid.tsx), pas via un effet réagissant à chaque
// changement de filtres : un tel effet tournerait dès le montage avec la
// valeur par défaut, avant que l'hydratation depuis localStorage n'ait eu
// la main, et écraserait la valeur qu'on vient de lire (constaté en
// React Strict Mode).

test("le filtre avancé du Planning survit à une navigation vers l'émargement puis un retour", async ({
  page,
}) => {
  await connecterEnTantQue(page, "administrateur");

  await page.getByRole("button", { name: "Filtres" }).click();
  await page.getByRole("button", { name: "Tout sélectionner" }).click();
  await expect(page.getByRole("button", { name: /Filtres/ })).toContainText(/\d/);
  const badgeAvant = await page.getByRole("button", { name: /Filtres/ }).innerText();
  await page.locator("body").click({ position: { x: 5, y: 5 } }); // ferme le panneau

  // Ouvre l'émargement d'un salarié visible (clic sur son nom), puis revient
  // en arrière comme le ferait un utilisateur réel.
  await page.locator('a[href*="/emargement?salarie="]').first().click();
  await expect(page).toHaveURL(/\/emargement\?salarie=/);
  await page.goBack();
  await expect(page).toHaveURL("/");

  const badgeApres = await page.getByRole("button", { name: /Filtres/ }).innerText();
  expect(badgeApres).toBe(badgeAvant);
});

test("le filtre avancé du Planning survit à une navigation vers l'Administration puis un retour", async ({
  page,
}) => {
  await connecterEnTantQue(page, "administrateur");

  await page.getByRole("button", { name: "Filtres" }).click();
  await page.getByRole("button", { name: "Tout sélectionner" }).click();
  const badgeAvant = await page.getByRole("button", { name: /Filtres/ }).innerText();
  await page.locator("body").click({ position: { x: 5, y: 5 } });

  await page.getByRole("link", { name: "Administration" }).click();
  await expect(page).toHaveURL(/\/admin\//);
  await page.goBack();
  await expect(page).toHaveURL("/");

  const badgeApres = await page.getByRole("button", { name: /Filtres/ }).innerText();
  expect(badgeApres).toBe(badgeAvant);
});
