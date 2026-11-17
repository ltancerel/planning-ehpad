import { test, expect } from "@playwright/test";
import { connecterEnTantQue } from "./auth-helpers";

// Bug du 17/11 : l'étiquette de groupe "Service" (ligne grise au-dessus de
// chaque service) utilisait un unique <td colSpan> sticky left-0 pour toute
// la largeur de la ligne. position: sticky est mal géré par les navigateurs
// sur une cellule colspannée — le texte, situé tout au début de cette
// cellule géante, scrollait donc hors champ comme un texte normal, alors
// que le nom du salarié juste en-dessous (sticky sur une cellule d'une
// seule colonne) restait toujours visible. Corrigé en isolant le texte
// dans une cellule d'une seule colonne (src/components/PlanningGrid.tsx).
//
// Assertion générale plutôt que dépendante des vrais noms de service (qui
// sont des données réelles STAGING, pas des constantes) : après un scroll
// horizontal, l'étiquette de service et le nom du salarié juste en-dessous
// doivent rester à la même position x — les deux sont sticky left-0 sur la
// même colonne.
test("l'étiquette de service reste visible au scroll horizontal, comme le nom du salarié", async ({
  page,
}) => {
  await connecterEnTantQue(page, "administrateur");

  // Force un affichage sur plusieurs semaines pour garantir un ascenseur
  // horizontal (par défaut, seules les 4 semaines visibles sont chargées,
  // cf. commentaire NB_SEMAINES_VISIBLES dans PlanningGrid.tsx).
  await page.evaluate(() => localStorage.setItem("planning-ehpad:nb-semaines-chargees", "12"));
  await page.reload();

  const premiereLigneGroupe = page.locator("table tbody tr").first().locator("td").first();
  const premiereLigneSalarie = page.locator("table tbody tr").nth(1).locator("td").first();
  await expect(premiereLigneGroupe).toBeVisible();
  await expect(premiereLigneSalarie).toBeVisible();

  const conteneurScroll = page.locator("table").first().locator("xpath=..");
  await conteneurScroll.evaluate((el) => {
    el.scrollLeft = 600;
  });
  // Laisse le navigateur appliquer le repositionnement sticky avant de lire
  // les positions — un screenshot pris trop tôt donnerait un faux négatif.
  await page.waitForTimeout(200);

  const boiteGroupe = await premiereLigneGroupe.boundingBox();
  const boiteSalarie = await premiereLigneSalarie.boundingBox();
  expect(boiteGroupe).not.toBeNull();
  expect(boiteSalarie).not.toBeNull();

  // Les deux cellules sont sticky left-0 sur la même colonne : leur bord
  // gauche doit coïncider après scroll. Avant le fix, l'étiquette de
  // service scrollait hors champ (x très négatif) pendant que le nom du
  // salarié restait à x ≈ 0.
  expect(Math.abs(boiteGroupe!.x - boiteSalarie!.x)).toBeLessThan(2);
  expect(boiteGroupe!.x).toBeGreaterThanOrEqual(0);
});
