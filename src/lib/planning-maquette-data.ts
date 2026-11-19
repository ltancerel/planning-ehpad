import { formatDateISO, genererPeriode } from "@/lib/dates";
import type { ValeurCellule } from "@/lib/horaire-codes";
import type { Salarie } from "@/lib/mock-data";

// Remplit la grille Planning de la maquette multi-application (EPIC #46,
// story #47) avec des codes horaires variés, pour qu'elle soit
// représentative d'une application réellement utilisée plutôt
// qu'entièrement hachurée (retour client du 20/11) — PlanningGrid ne
// reçoit normalement ses cases que via chargerPlanningReel (Supabase),
// absent de cette maquette sans backend.

// Motif hebdomadaire par service (Lun→Dim), rejoué en boucle sur toute la
// période générée.
const MOTIFS_PAR_SERVICE: Record<string, string[]> = {
  IDE: ["SEC", "SEC", "SEC", ".", ".", "SEC", "SEC"],
  ASH: ["70A", "70A", ".", "70A", "60S", ".", "."],
  Administratif: ["SEC", "SEC", "SEC", "SEC", "SEC", ".", "."],
};

export function genererPlanningDemo(salaries: Salarie[]): Record<string, ValeurCellule> {
  const debut = new Date(2026, 7, 24); // lundi 24/08/2026
  const jours = genererPeriode(debut, 70); // 10 semaines, couvre largement la période par défaut

  const planning: Record<string, ValeurCellule> = {};

  salaries.forEach((salarie, indexSalarie) => {
    const motif = MOTIFS_PAR_SERVICE[salarie.service] ?? MOTIFS_PAR_SERVICE.Administratif;

    jours.forEach((jour, indexJour) => {
      const code = motif[(indexJour + indexSalarie) % motif.length];
      const cle = `${salarie.id}__${formatDateISO(jour)}`;
      planning[cle] = code === "." ? { informatif: "." } : { travail: code };
    });

    // Quelques évènements ponctuels pour varier l'affichage, décalés par
    // salarié pour ne pas tomber au même endroit pour tout le monde.
    const decalage = indexSalarie * 5;
    if (jours[10 + decalage]) {
      planning[`${salarie.id}__${formatDateISO(jours[10 + decalage])}`] = { informatif: "ABS" };
    }
    if (jours[17 + decalage] && jours[18 + decalage]) {
      const base = motif[(17 + decalage + indexSalarie) % motif.length];
      const travail = base === "." ? "SEC" : base;
      planning[`${salarie.id}__${formatDateISO(jours[17 + decalage])}`] = { travail, evenementiel: "MAL" };
      planning[`${salarie.id}__${formatDateISO(jours[18 + decalage])}`] = { travail, evenementiel: "MAL" };
    }
    if (jours[30 + decalage]) {
      const base = motif[(30 + decalage + indexSalarie) % motif.length];
      const travail = base === "." ? "SEC" : base;
      planning[`${salarie.id}__${formatDateISO(jours[30 + decalage])}`] = { travail, evenementiel: "CP" };
    }
  });

  return planning;
}
