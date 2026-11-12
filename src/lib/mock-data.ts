import { formatDateISO } from "./dates";
import { genererJoursFeriesFixes, genererJoursFeriesConfigurables } from "./jours-feries";

export type Salarie = {
  id: string;
  nom: string;
  prenom: string;
  service: string;
  groupeRoulement: GroupeRoulement | null;
  presence: "Présent" | "Absent";
  typePaie: TypePaie;
};

export type ProfilUtilisateur = {
  nom: string;
  prenom: string;
  typeUtilisateur: "Administrateur" | "Manager" | "Utilisateur";
  service: string;
  // Services dont ce compte est responsable (administrateur/manager
  // uniquement, cf. service.responsable_id) — utilisé par le raccourci
  // "Mes services" du filtre avancé de la grille Planning.
  mesServices: string[];
  poste: string;
};

export type Utilisateur = {
  id: string;
  identifiant: string; // 3 lettres majuscules
  nom: string;
  prenom: string;
  email: string;
  typeUtilisateur: "Administrateur" | "Manager" | "Utilisateur";
  // Services dont ce compte est responsable (administrateur/manager
  // uniquement, cf. service.responsable_id) — toujours vide pour
  // Utilisateur, 0 à N pour les deux autres types (retour client du 29/10,
  // remplace l'ancien champ `service` à valeur unique).
  services: string[];
  poste: string;
};

// Regroupement salarié à valeurs "Équipe A/B/C/D" (ajouté le 23/09), affiché
// à l'écran sous le libellé "Alignement roulement" (formulaire, colonne de
// liste, filtre) plutôt que "Équipe" — distinct du roulement horaire (type
// Roulement ci-dessous, motif d'horaires assigné via AffectationRoulement),
// d'où le nom GroupeRoulement/GROUPES_ROULEMENT malgré des valeurs "Équipe".
// Optionnel (retour client du 12/11) : un salarié peut n'appartenir à
// aucune équipe — colonne alignement_roulement déjà nullable en base, sans
// CHECK restreignant ses valeurs ; "Aucun" se représente par `null`,
// jamais comme une 5e valeur du type/tableau ci-dessous.
export type GroupeRoulement = "Équipe A" | "Équipe B" | "Équipe C" | "Équipe D";
export const GROUPES_ROULEMENT: GroupeRoulement[] = ["Équipe A", "Équipe B", "Équipe C", "Équipe D"];

export type TypePaie = "25/M" | "30/M" | "Aucun";

export type FicheSalarie = {
  id: string;
  matricule: string; // 2 à 5 lettres et/ou chiffres, majuscules
  nom: string;
  prenom: string;
  service: string;
  typePaie: TypePaie;
  groupeRoulement: GroupeRoulement | null;
  presence: "Présent" | "Absent";
};

// Un roulement est une structure répétitive (pattern) d'horaires sur une ou
// plusieurs semaines (cf. CDC). Chaque semaine du motif est un bloc complet
// Lundi->Dimanche (roulement aligné sur la semaine) : motif[s][j] avec
// j = 0 (lundi) .. 6 (dimanche). Une case vide ("") = repos, pas d'horaire.
export type Roulement = {
  id: string;
  nom: string;
  nbSemaines: number;
  motif: string[][];
};

// Affectation d'un roulement à un salarié sur une période donnée (cf. story
// « Appliquer un roulement à un salarié »). dateDebut est toujours un lundi ;
// dateFin absente = affectation en cours. Un salarié n'a par défaut aucun
// roulement : l'affectation est un choix explicite fait depuis sa fiche.
export type AffectationRoulement = {
  id: string;
  roulementId: string;
  dateDebut: string; // ISO, lundi
  dateFin?: string; // ISO
};

export function affectationsRecentesDabord(affectations: AffectationRoulement[]): AffectationRoulement[] {
  return [...affectations].sort((a, b) => b.dateDebut.localeCompare(a.dateDebut));
}

export function affectationActuelle(
  affectations: AffectationRoulement[],
  dateReferenceISO: string
): AffectationRoulement | undefined {
  return affectationsRecentesDabord(affectations).find(
    (a) => a.dateDebut <= dateReferenceISO && (!a.dateFin || a.dateFin >= dateReferenceISO)
  );
}

export type JourFerie = {
  date: string; // ISO yyyy-mm-dd
  label: string;
  type: "fixe" | "calcule" | "personnalise";
  actif: boolean;
};

export type AnneePlanifiee = {
  id: string;
  annee: number;
  jourDemarrage: string; // ISO yyyy-mm-dd
  joursFeries: JourFerie[];
};

export function genererJoursFeriesDefaut(annee: number): JourFerie[] {
  return [
    ...genererJoursFeriesFixes(annee).map(({ date, label }) => ({
      date: formatDateISO(date),
      label,
      type: "fixe" as const,
      actif: true,
    })),
    ...genererJoursFeriesConfigurables(annee).map(({ date, label }) => ({
      date: formatDateISO(date),
      label,
      type: "calcule" as const,
      actif: true,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));
}
