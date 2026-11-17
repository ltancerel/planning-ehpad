import { test, expect } from "@playwright/test";
import { connecterEnTantQue } from "./auth-helpers";

// Bug du 17/11 : les flèches ← → pilotaient le défilement horizontal à
// partir de scrollLeft/scrollWidth (pixels bruts). Le reliquat de place
// restante dans le lot chargé n'étant presque jamais un multiple exact
// d'une largeur de semaine (ça dépend de la largeur réelle de la fenêtre),
// le navigateur tronquait le défilement demandé à ce qui restait,
// atterrissant au milieu d'une semaine plutôt que sur un lundi. Corrigé en
// pilotant le scroll à partir d'un compteur entier de semaines
// (PlanningGrid.tsx, semaineVisible) plutôt que de pixels.
//
// Assertion sur le texte de l'en-tête de période ("DD/MM – DD/MM YYYY"),
// qui expose directement le premier jour affiché : chaque clic doit le
// décaler d'exactement 7 jours, dans les deux sens.

function premierJour(enteteTexte: string): Date {
  const [jour, mois] = enteteTexte.split("–")[0].trim().split("/").map(Number);
  const annee = Number(enteteTexte.match(/(\d{4})/)![1]);
  return new Date(annee, mois - 1, jour);
}

test("les flèches de navigation du Planning avancent/reculent toujours d'exactement une semaine, alignée sur un lundi", async ({
  page,
}) => {
  await connecterEnTantQue(page, "administrateur");

  const boutonEntete = page.getByRole("button", { name: /–.*\d{4}/ });
  const dateDepart = premierJour(await boutonEntete.innerText());
  expect(dateDepart.getDay()).toBe(1); // 1 = lundi

  await page.getByRole("button", { name: "Semaine précédente" }).click();
  const apresPrecedente = premierJour(await boutonEntete.innerText());
  expect(apresPrecedente.getDay()).toBe(1);
  expect((dateDepart.getTime() - apresPrecedente.getTime()) / 86_400_000).toBe(7);

  await page.getByRole("button", { name: "Semaine suivante" }).click();
  await page.getByRole("button", { name: "Semaine suivante" }).click();
  const apresDeuxSuivantes = premierJour(await boutonEntete.innerText());
  expect(apresDeuxSuivantes.getDay()).toBe(1);
  expect((apresDeuxSuivantes.getTime() - dateDepart.getTime()) / 86_400_000).toBe(7);
});
