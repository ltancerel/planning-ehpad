// Données fictives pour la maquette Actions PAQG (EPIC #46, story #47) —
// reprend le contenu du plan d'action maquetté sur experiment/qualite-maquette
// (DUERP + référentiel HAS), simplifié : plus besoin des jeux de données
// complets (catégories de risques, critères HAS) puisque seul le libellé
// d'origine déjà résolu est affiché ici, pas le détail sous-jacent.

export type StatutAction = "a_faire" | "en_cours" | "fait";

export const STATUTS: StatutAction[] = ["a_faire", "en_cours", "fait"];

export const LIBELLES_STATUT: Record<StatutAction, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  fait: "Fait",
};

// Catalogue des origines possibles pour une action — dans l'application
// réelle, une table de référence en base (catégories DUERP, critères
// HAS), alimentée et tenue à jour indépendamment des actions elles-mêmes.
// Pour cette maquette sans backend, elle est simplement hardcodée ici
// (retour client du 21/11 : pouvoir préciser l'origine à la saisie et à
// la modification d'une action, pas seulement au moment de la génération
// des données de démo).
export type OrigineCatalogue = { badge: "DUERP" | "HAS"; texte: string };

export const CATALOGUE_ORIGINES: OrigineCatalogue[] = [
  { badge: "DUERP", texte: "Plan d'action global" },
  { badge: "DUERP", texte: "Catégorie DUERP : Risques physiques" },
  { badge: "DUERP", texte: "Catégorie DUERP : Chute et glissade" },
  { badge: "DUERP", texte: "Catégorie DUERP : Risques spécifiques" },
  { badge: "DUERP", texte: "Catégorie DUERP : Psychosociaux" },
  { badge: "HAS", texte: "Affichage obligatoire" },
  { badge: "HAS", texte: "Risque de chute" },
  { badge: "HAS", texte: "Révisions de projet personnalisé" },
];

export type ActionQualite = {
  id: string;
  origineBadge: "DUERP" | "HAS";
  origineTexte: string;
  intitule: string;
  details?: string;
  responsable: string;
  echeance: string; // ISO yyyy-mm-dd, pour tri/retard
  echeanceLabel?: string; // affichage si différent (ex. "2026 — T4")
  statut: StatutAction;
  imperatif?: boolean;
};

export const ACTIONS_DEMO: ActionQualite[] = [
  {
    id: "duerp-26-01",
    origineBadge: "DUERP",
    origineTexte: "Plan d'action global",
    intitule: "Nommer et former un relai de prévention",
    responsable: "Directrice",
    echeance: "2026-12-31",
    echeanceLabel: "2026 — T4",
    statut: "a_faire",
  },
  {
    id: "duerp-26-02",
    origineBadge: "DUERP",
    origineTexte: "Catégorie DUERP : Risques physiques",
    intitule: "Mesures de prévention à définir (risques physiques)",
    responsable: "À définir",
    echeance: "2027-12-31",
    echeanceLabel: "À définir",
    statut: "a_faire",
  },
  {
    id: "duerp-26-03",
    origineBadge: "DUERP",
    origineTexte: "Catégorie DUERP : Chute et glissade",
    intitule: "Mesures de prévention à définir (chute et glissade)",
    responsable: "À définir",
    echeance: "2027-12-31",
    echeanceLabel: "À définir",
    statut: "a_faire",
  },
  {
    id: "duerp-26-04",
    origineBadge: "DUERP",
    origineTexte: "Catégorie DUERP : Risques spécifiques",
    intitule:
      "Risque attentat : élaborer le protocole « intrusion ou attentat », mettre en place les moyens d'alerte et de communication, faire des exercices de simulation",
    responsable: "Directrice",
    echeance: "2026-12-31",
    echeanceLabel: "2026 — T4",
    statut: "a_faire",
    imperatif: true,
  },
  {
    id: "duerp-26-05",
    origineBadge: "DUERP",
    origineTexte: "Catégorie DUERP : Risques spécifiques",
    intitule:
      "Risque incendie : organiser l'alerte, l'évacuation et/ou la mise à l'abri des résidents et des professionnels",
    responsable: "Directrice",
    echeance: "2026-12-31",
    echeanceLabel: "2026 — T4",
    statut: "a_faire",
    imperatif: true,
  },
  {
    id: "duerp-26-06",
    origineBadge: "DUERP",
    origineTexte: "Catégorie DUERP : Psychosociaux",
    intitule: "Programmer des formations « gestion du stress »",
    responsable: "À définir",
    echeance: "2027-12-31",
    echeanceLabel: "À définir",
    statut: "a_faire",
  },
  {
    id: "has-a1",
    origineBadge: "HAS",
    origineTexte: "Révisions de projet personnalisé",
    intitule: "Planifier les révisions annuelles de projet personnalisé dans le calendrier IDEC",
    responsable: "IDEC",
    echeance: "2026-09-30",
    statut: "en_cours",
  },
  {
    id: "has-a2",
    origineBadge: "HAS",
    origineTexte: "Risque de chute",
    intitule: "Déployer une grille d'évaluation du risque de chute à l'entrée de chaque résident",
    responsable: "Médecin coordonnateur",
    echeance: "2026-07-15",
    statut: "a_faire",
  },
  {
    id: "has-a3",
    origineBadge: "HAS",
    origineTexte: "Affichage obligatoire",
    intitule: "Publier le DUERP mis à jour et son plan d'action sur l'affichage obligatoire",
    responsable: "Direction",
    echeance: "2026-02-28",
    statut: "fait",
  },
];
