import { test, expect } from "@playwright/test";
import { connecterEnTantQue } from "./auth-helpers";

// Bug du 17/11 : le panneau d'action de la sélection groupée (résumé +
// boutons "Appliquer un code…", "Effacer", "Annuler") s'ancrait sous le
// point de relâchement de la souris sans jamais vérifier qu'il tenait dans
// la fenêtre — pour une sélection près du bas de l'écran, ses boutons
// devenaient inatteignables. Corrigé en reprenant le recadrage déjà en
// place pour HoraireCodeSelector (mesurer la taille réelle une fois rendu,
// puis contraindre dans la fenêtre visible, marge 8px) — cf.
// PlanningGrid.tsx, positionActionSelectionAffichee.
//
// Fenêtre volontairement basse pour forcer le recadrage quelle que soit la
// hauteur réelle du jeu de données STAGING.
test.use({ viewport: { width: 1200, height: 300 } });

function ligneSalarie(page: import("@playwright/test").Page) {
  return page.locator("tr").filter({ has: page.locator('a[href*="/emargement?salarie="]') });
}

test("le panneau d'action d'une sélection groupée reste entièrement visible, même près du bas de l'écran", async ({
  page,
}) => {
  await connecterEnTantQue(page, "administrateur");

  const lignes = ligneSalarie(page);
  const celluleDepart = lignes.nth(0).locator("td").nth(1);
  const celluleArrivee = lignes.nth(3).locator("td").nth(1);

  const boiteDepart = await celluleDepart.boundingBox();
  const boiteArrivee = await celluleArrivee.boundingBox();
  if (!boiteDepart || !boiteArrivee) throw new Error("Cellules du Planning introuvables.");

  await page.mouse.move(boiteDepart.x + 5, boiteDepart.y + 5);
  await page.mouse.down();
  await page.mouse.move(boiteArrivee.x + 5, boiteArrivee.y + 5, { steps: 10 });
  await page.mouse.up();

  const boutonAnnuler = page.getByRole("button", { name: "Annuler" });
  await expect(boutonAnnuler).toBeVisible();

  const boiteBouton = await boutonAnnuler.boundingBox();
  expect(boiteBouton).not.toBeNull();
  const { height: hauteurFenetre } = page.viewportSize()!;
  expect(boiteBouton!.y + boiteBouton!.height).toBeLessThanOrEqual(hauteurFenetre);

  // Le bouton doit aussi être réellement cliquable à cette position (pas
  // seulement "dans les limites" géométriquement).
  await boutonAnnuler.click();
  await expect(boutonAnnuler).not.toBeVisible();
});
