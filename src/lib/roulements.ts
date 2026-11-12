import type { AffectationRoulement, Roulement } from "./mock-data";

// Reconstruit le format Roulement.motif (code court par case, "" = repos —
// cf. mock-data.ts) à partir des lignes réelles de roulement_jour, utilisé
// aussi bien par la grille Planning (src/app/page.tsx) que par l'écran
// Salariés (src/app/admin/salaries/page.tsx), d'où ce petit helper partagé
// plutôt que dupliqué dans les deux Server Components.
type LigneRoulement = {
  id: string;
  nom: string;
  nb_semaines: number;
  roulement_jour: { semaine_index: number; jour_semaine: number; code: { code: string } | null }[];
};

export function construireRoulements(lignes: LigneRoulement[]): Roulement[] {
  return lignes.map((r) => {
    const motif: string[][] = Array.from({ length: r.nb_semaines }, () => Array(7).fill(""));
    for (const rj of r.roulement_jour) {
      if (rj.code) motif[rj.semaine_index][rj.jour_semaine] = rj.code.code;
    }
    return { id: r.id, nom: r.nom, nbSemaines: r.nb_semaines, motif };
  });
}

type LigneAffectation = {
  id: string;
  salarie_id: string;
  roulement_id: string;
  date_debut: string;
  date_fin: string | null;
};

export function grouperAffectationsParSalarie(
  lignes: LigneAffectation[]
): Record<string, AffectationRoulement[]> {
  const parSalarie: Record<string, AffectationRoulement[]> = {};
  for (const a of lignes) {
    const liste = parSalarie[a.salarie_id] ?? [];
    liste.push({
      id: a.id,
      roulementId: a.roulement_id,
      dateDebut: a.date_debut,
      dateFin: a.date_fin ?? undefined,
    });
    parSalarie[a.salarie_id] = liste;
  }
  return parSalarie;
}
