export type HoraireCategorie = "travail" | "informatif" | "evenementiel";

export type Plage = { debut: string; fin: string };

// Trois types de code évènementiel (retour client du 23/09, refonte complète
// des codes horaires) :
// - "special" : se superpose au code de travail et l'efface visuellement (la
//   cellule affiche uniquement le code évènementiel, en pleine cellule) mais
//   ne touche pas au décompte d'heures — les heures du code de travail
//   superposé restent comptées telles quelles (visibles au survol). Pas de
//   durée propre.
// - "normal" : se superpose au code de travail, qui reste visible mais barré,
//   le code évènementiel apparaissant dessous. Sa durée propre (duree)
//   remplace entièrement celle du code de travail.
// - "partiel" : une ou plusieurs plages horaires sont saisies au moment de
//   positionner l'évènement sur le planning, qui viennent compléter (heures
//   en plus) ou chevaucher (heures en moins) le code de travail. Le code de
//   travail n'est pas barré ; le delta est calculé dynamiquement, pas fixé
//   par le code.
export type TypeEvenement = "special" | "normal" | "partiel";

export type HoraireCode = {
  code: string;
  intitule: string;
  categorie: HoraireCategorie;
  couleurFond: string;
  couleurTexte: string;
  commentaire?: string;
  plages?: Plage[];
  // Champs spécifiques aux codes événementiels (categorie === "evenementiel")
  action?: string;
  typeEvenement?: TypeEvenement;
  // Uniquement pour typeEvenement === "normal" : durée fixe (en heures) qui
  // remplace celle du code de travail superposé.
  duree?: number;
  // Si coché, ce code colore son jour dans la vue annuelle d'un salarié
  // (repérage rapide des évènements particuliers sur 365/366 jours, sans
  // détail d'horaire) — cf. retour client du 17/09, story #16. Disponible
  // pour toute catégorie : a priori réservé aux codes événementiels, mais
  // le client ne veut pas exclure un code de travail.
  afficherVueAnnuelle?: boolean;
};

function minutesDeLaPlage(plage: Plage): { debut: number; fin: number } | null {
  const [hd, md] = plage.debut.split(":").map(Number);
  const [hf, mf] = plage.fin.split(":").map(Number);
  if (Number.isNaN(hd) || Number.isNaN(md) || Number.isNaN(hf) || Number.isNaN(mf)) return null;
  if (hd === 0 && md === 0 && hf === 0 && mf === 0) return null;
  const debut = hd * 60 + md;
  let fin = hf * 60 + mf;
  if (fin <= debut) fin += 24 * 60; // plage traversant minuit
  return { debut, fin };
}

export function dureeHeures(plages: Plage[] = []): number {
  return plages.reduce((total, plage) => {
    const bornes = minutesDeLaPlage(plage);
    return bornes ? total + (bornes.fin - bornes.debut) / 60 : total;
  }, 0);
}

// Chevauchement (en heures) entre deux plages, 0 si aucun recouvrement.
function chevauchementHeures(a: Plage, b: Plage): number {
  const A = minutesDeLaPlage(a);
  const B = minutesDeLaPlage(b);
  if (!A || !B) return 0;
  const debut = Math.max(A.debut, B.debut);
  const fin = Math.min(A.fin, B.fin);
  return Math.max(0, fin - debut) / 60;
}

// Delta d'heures (positif = heures en plus, négatif = heures en moins) d'un
// évènement "partiel" par rapport aux plages du code de travail : la
// partie de la plage évènement qui chevauche le travail compte en moins,
// la partie hors travail (complément) compte en plus.
export function deltaComplementHeures(plageEvenement: Plage, plagesTravail: Plage[]): number {
  const dureeEvenement = dureeHeures([plageEvenement]);
  const chevauchementTotal = Math.min(
    dureeEvenement,
    plagesTravail.reduce((total, p) => total + chevauchementHeures(plageEvenement, p), 0)
  );
  const horsTravail = dureeEvenement - chevauchementTotal;
  return horsTravail - chevauchementTotal;
}

// Un évènement "partiel" peut porter plusieurs plages (ex. une arrivée
// anticipée le matin ET un départ tardif le soir sur le même jour) — le
// delta total est la somme des deltas de chaque plage, chacune évaluée
// indépendamment par rapport au code de travail.
export function deltaComplementHeuresMulti(plagesEvenement: Plage[], plagesTravail: Plage[]): number {
  return plagesEvenement.reduce((total, plage) => total + deltaComplementHeures(plage, plagesTravail), 0);
}

// Une plage "partiel" doit être, pour chaque plage de travail, soit
// entièrement incluse dedans (heures en moins), soit entièrement en dehors
// (heures en plus) — un chevauchement partiel serait ambigu pour
// l'utilisateur (retour client du 17/09 : ex. code 8h-18h, refuser 16h-20h).
export function plageComplementValide(plageEvenement: Plage, plagesTravail: Plage[]): boolean {
  const evenement = minutesDeLaPlage(plageEvenement);
  // Une plage mal saisie (texte libre non reconnu) n'est pas bloquée ici :
  // elle sera simplement sans effet sur le décompte d'heures. Seul un
  // chevauchement partiel avéré est refusé (retour client du 17/09).
  if (!evenement) return true;
  return plagesTravail.every((plageTravail) => {
    const travail = minutesDeLaPlage(plageTravail);
    if (!travail) return true;
    const chevauche = Math.min(evenement.fin, travail.fin) - Math.max(evenement.debut, travail.debut) > 0;
    if (!chevauche) return true;
    return evenement.debut >= travail.debut && evenement.fin <= travail.fin;
  });
}

export const HORAIRE_CODES: HoraireCode[] = [
  // Horaires informatifs (dont les anciens codes "particuliers" REPOS/ABSENCE,
  // fusionnés ici — retour client du 23/09 : plus de catégorie Particulier)
  { code: ".", intitule: "REPOS", categorie: "informatif", couleurFond: "#f4f4f5", couleurTexte: "#71717a" },
  { code: "ABS", intitule: "ABSENCE", categorie: "informatif", couleurFond: "#e4e4e7", couleurTexte: "#3f3f46" },
  { code: "?", intitule: "À demander", categorie: "informatif", couleurFond: "#fef08a", couleurTexte: "#713f12" },
  { code: "??", intitule: "En attente de réponse", categorie: "informatif", couleurFond: "#fef08a", couleurTexte: "#713f12" },
  { code: "DISP", intitule: "Disponible", categorie: "informatif", couleurFond: "#f0fdf4", couleurTexte: "#166534" },
  { code: "NDISP", intitule: "Non disponible", categorie: "informatif", couleurFond: "#fef2f2", couleurTexte: "#991b1b" },
  { code: "SOUT", intitule: "Soutien", categorie: "informatif", couleurFond: "#ede9fe", couleurTexte: "#5b21b6" },
  { code: "DOUB", intitule: "Doublure", categorie: "informatif", couleurFond: "#ede9fe", couleurTexte: "#5b21b6" },

  // Horaires de travail (plages -> heures calculées) — inchangés
  {
    code: "60S",
    intitule: "ASH 60S",
    categorie: "travail",
    couleurFond: "#dbeafe",
    couleurTexte: "#1e3a8a",
    plages: [{ debut: "06:00", fin: "13:00" }, { debut: "14:00", fin: "17:30" }],
  },
  {
    code: "70A",
    intitule: "ASH 70A",
    categorie: "travail",
    couleurFond: "#dbeafe",
    couleurTexte: "#1e3a8a",
    plages: [{ debut: "07:00", fin: "13:00" }, { debut: "14:00", fin: "19:00" }],
  },
  {
    code: "185",
    intitule: "ASH 185",
    categorie: "travail",
    couleurFond: "#dbeafe",
    couleurTexte: "#1e3a8a",
    plages: [{ debut: "18:00", fin: "23:00" }, { debut: "00:00", fin: "05:00" }],
  },
  {
    code: "SEC",
    intitule: "Secteur",
    categorie: "travail",
    couleurFond: "#e4e4e7",
    couleurTexte: "#27272a",
    plages: [{ debut: "07:00", fin: "15:00" }],
  },
  {
    code: "OK",
    intitule: "Confirmé",
    categorie: "travail",
    couleurFond: "#bbf7d0",
    couleurTexte: "#14532d",
    plages: [{ debut: "07:00", fin: "15:00" }],
  },

  // Horaires événementiels — type "special" (efface l'affichage du travail,
  // pleine cellule, garde ses heures)
  {
    code: "CP",
    intitule: "Congés",
    categorie: "evenementiel",
    couleurFond: "#60a5fa",
    couleurTexte: "#1e3a8a",
    action: "Remplace l'affichage du code de travail, garde ses heures",
    typeEvenement: "special",
    afficherVueAnnuelle: true,
  },
  {
    code: "MAL",
    intitule: "Maladie",
    categorie: "evenementiel",
    couleurFond: "#f97316",
    couleurTexte: "#ffffff",
    action: "Remplace l'affichage du code de travail, garde ses heures",
    typeEvenement: "special",
    afficherVueAnnuelle: true,
  },
  {
    code: "CARJ",
    intitule: "Carence maladie (journalière)",
    categorie: "evenementiel",
    couleurFond: "#ef4444",
    couleurTexte: "#ffffff",
    action: "Remplace l'affichage du code de travail, garde ses heures",
    typeEvenement: "special",
    afficherVueAnnuelle: true,
  },
  {
    code: "ABA",
    intitule: "Congé sans solde",
    categorie: "evenementiel",
    couleurFond: "#a1a1aa",
    couleurTexte: "#ffffff",
    action: "Remplace l'affichage du code de travail, garde ses heures",
    typeEvenement: "special",
    afficherVueAnnuelle: true,
  },

  // Horaires événementiels — type "normal" (travail barré, code dessous, sa
  // propre durée remplace celle du travail)
  {
    code: "ABI",
    intitule: "Absence injustifiée",
    categorie: "evenementiel",
    couleurFond: "#dc2626",
    couleurTexte: "#ffffff",
    action: "Remplace le code de travail (barré) et sa durée",
    typeEvenement: "normal",
    duree: 0,
    afficherVueAnnuelle: true,
  },

  // Horaires événementiels — type "partiel" (plage horaire saisie à la
  // volée : chevauchement du travail = heures en moins, hors travail =
  // heures en plus, cf. retour client du 17/09)
  {
    code: "ABT",
    intitule: "Absence temporaire",
    categorie: "evenementiel",
    couleurFond: "#fed7aa",
    couleurTexte: "#713f12",
    action: "Complète le code horaire sur une plage saisie à la volée",
    typeEvenement: "partiel",
  },
  {
    code: "HSP",
    intitule: "Heures supplémentaires",
    categorie: "evenementiel",
    couleurFond: "#bbf7d0",
    couleurTexte: "#14532d",
    action: "Complète le code horaire sur une plage saisie à la volée",
    typeEvenement: "partiel",
  },
  {
    code: "CARP",
    intitule: "Carence maladie (partielle)",
    categorie: "evenementiel",
    couleurFond: "#fca5a5",
    couleurTexte: "#7f1d1d",
    action: "Complète le code horaire sur une plage saisie à la volée",
    typeEvenement: "partiel",
  },
];

export const HORAIRE_CODES_PAR_CODE: Record<string, HoraireCode> = Object.fromEntries(
  HORAIRE_CODES.map((h) => [h.code.toUpperCase(), h])
);

export function heuresDuCode(code: string): number {
  const horaire = HORAIRE_CODES_PAR_CODE[code.toUpperCase()];
  if (!horaire?.plages) return 0;
  return dureeHeures(horaire.plages);
}

// Une cellule du planning peut porter un code travail, un code informatif et
// un code événementiel — jamais les 3 à la fois (retour client du 23/09).
// L'informatif s'affiche sous le travail s'il y en a un, en pleine cellule
// sinon. Un code évènementiel ne peut se superposer qu'à un code de travail
// déjà présent (jamais sur une cellule vide), et jamais si un informatif est
// déjà là (l'utilisateur doit l'effacer explicitement d'abord).
export type ValeurCellule = {
  travail?: string;
  informatif?: string;
  evenementiel?: string;
  // Uniquement pour un évènement de type "partiel" : la ou les plages
  // horaires saisies au moment de le positionner sur le planning (retour
  // client du 22/09 : plusieurs plages possibles, ex. une arrivée anticipée
  // et un départ tardif le même jour).
  evenementielPlages?: Plage[];
};

// Un code se superpose visuellement au travail (types "special"/"normal") —
// se distingue du type "partiel", qui ouvre un formulaire de plage(s) plutôt
// que de s'appliquer directement.
export function estCodeSuperposable(code: string): boolean {
  const horaire = HORAIRE_CODES_PAR_CODE[code.toUpperCase()];
  return horaire?.categorie === "evenementiel" && (horaire.typeEvenement === "special" || horaire.typeEvenement === "normal");
}

export function estCodePartiel(code: string): boolean {
  return HORAIRE_CODES_PAR_CODE[code.toUpperCase()]?.typeEvenement === "partiel";
}

// Un informatif peut s'ajouter tant que la cellule n'a pas déjà un travail ET
// un évènementiel en même temps (jamais 3 codes à la fois sur une cellule).
export function peutAjouterInformatif(valeur: ValeurCellule): boolean {
  return !(valeur.travail && valeur.evenementiel);
}

// Un évènementiel ne peut se superposer qu'à un travail déjà présent (jamais
// sur une cellule vide), et pas si un informatif occupe déjà la cellule.
export function peutAjouterEvenementiel(valeur: ValeurCellule): boolean {
  return Boolean(valeur.travail) && !valeur.informatif;
}

// Delta (en heures, signé) apporté par un évènement "partiel" sur une
// cellule, ou undefined si non applicable — pour l'afficher explicitement
// (+/-) dans l'émargement mensuel, cf. retour client du 17/09.
export function deltaEvenementielCellule(valeur: ValeurCellule): number | undefined {
  if (!valeur.evenementiel || !valeur.evenementielPlages?.length) return undefined;
  const horaireEvenementiel = HORAIRE_CODES_PAR_CODE[valeur.evenementiel.toUpperCase()];
  if (horaireEvenementiel?.typeEvenement !== "partiel") return undefined;
  const plagesTravail = valeur.travail ? (HORAIRE_CODES_PAR_CODE[valeur.travail.toUpperCase()]?.plages ?? []) : [];
  return deltaComplementHeuresMulti(valeur.evenementielPlages, plagesTravail);
}

export function heuresReellesCellule(valeur: ValeurCellule): number {
  const heuresBase = valeur.travail ? heuresDuCode(valeur.travail) : 0;
  if (!valeur.evenementiel) return heuresBase;
  const horaireEvenementiel = HORAIRE_CODES_PAR_CODE[valeur.evenementiel.toUpperCase()];
  switch (horaireEvenementiel?.typeEvenement) {
    case "partiel": {
      const delta = deltaEvenementielCellule(valeur) ?? 0;
      return Math.max(0, heuresBase + delta);
    }
    case "normal":
      return horaireEvenementiel.duree ?? 0;
    case "special":
    default:
      return heuresBase;
  }
}
