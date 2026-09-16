export type HoraireCategorie = "travail" | "informatif" | "evenementiel" | "special";

export type Plage = { debut: string; fin: string };

export type RegleHeuresEvenement = "zero" | "code_initial" | "personnalise";

// Deux types d'évènement (retour client du 17/09) :
// - "superposition" : se superpose au code de travail et écrase entièrement
//   le décompte d'heures (règle regleHeures) — le code de travail reste
//   visible mais barré. C'est le comportement historique (CAR/ABI/MAL).
// - "complement" : une plage horaire saisie au moment de positionner
//   l'évènement sur le planning, qui vient compléter (heures en plus) ou
//   chevaucher (heures en moins) le code de travail. Le code de travail
//   n'est pas barré dans ce cas ; le delta est calculé dynamiquement, pas
//   fixé par le code.
export type TypeEvenement = "superposition" | "complement";

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
  regleHeures?: RegleHeuresEvenement; // uniquement pour typeEvenement === "superposition"
  heuresPersonnalisees?: number;
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
// évènement "complement" par rapport aux plages du code de travail : la
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

export const HORAIRE_CODES: HoraireCode[] = [
  // Horaires particuliers
  { code: ".", intitule: "REPOS", categorie: "special", couleurFond: "#f4f4f5", couleurTexte: "#71717a" },
  { code: "ABS", intitule: "ABSENCE", categorie: "special", couleurFond: "#e4e4e7", couleurTexte: "#3f3f46" },

  // Horaires de travail (plages -> heures calculées)
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

  // Horaires informatifs
  { code: "?", intitule: "À demander", categorie: "informatif", couleurFond: "#fef08a", couleurTexte: "#713f12" },
  { code: "??", intitule: "En attente de réponse", categorie: "informatif", couleurFond: "#fef08a", couleurTexte: "#713f12" },
  { code: "DISP", intitule: "Disponible", categorie: "informatif", couleurFond: "#f0fdf4", couleurTexte: "#166534" },
  { code: "NDISP", intitule: "Non disponible", categorie: "informatif", couleurFond: "#fef2f2", couleurTexte: "#991b1b" },
  { code: "SOUT", intitule: "Soutien", categorie: "informatif", couleurFond: "#ede9fe", couleurTexte: "#5b21b6" },
  { code: "DOUB", intitule: "Doublure", categorie: "informatif", couleurFond: "#ede9fe", couleurTexte: "#5b21b6" },

  // Horaires événementiels — type "superposition" (se superposent au code de
  // travail et écrasent entièrement le décompte, cf. regleHeures)
  {
    code: "CAR",
    intitule: "Carence maladie",
    categorie: "evenementiel",
    couleurFond: "#ef4444",
    couleurTexte: "#ffffff",
    action: "Se superpose au code horaire",
    typeEvenement: "superposition",
    regleHeures: "zero",
  },
  {
    code: "ABI",
    intitule: "Absence injustifiée",
    categorie: "evenementiel",
    couleurFond: "#dc2626",
    couleurTexte: "#ffffff",
    action: "Se superpose au code horaire",
    typeEvenement: "superposition",
    regleHeures: "zero",
  },
  {
    code: "MAL",
    intitule: "Maladie",
    categorie: "evenementiel",
    couleurFond: "#f97316",
    couleurTexte: "#ffffff",
    action: "Se superpose au code horaire",
    typeEvenement: "superposition",
    regleHeures: "code_initial",
  },
  { code: "ABA", intitule: "Congé sans solde", categorie: "evenementiel", couleurFond: "#a1a1aa", couleurTexte: "#ffffff" },
  { code: "CP", intitule: "Congés", categorie: "evenementiel", couleurFond: "#60a5fa", couleurTexte: "#1e3a8a" },

  // Horaire événementiel — type "complement" (plage horaire saisie à la
  // volée : chevauchement du travail = heures en moins, hors travail =
  // heures en plus, cf. retour client du 17/09)
  {
    code: "AJT",
    intitule: "Ajustement ponctuel (absence ou heures sup.)",
    categorie: "evenementiel",
    couleurFond: "#facc15",
    couleurTexte: "#713f12",
    action: "Complète le code horaire sur une plage saisie à la volée",
    typeEvenement: "complement",
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

// Une cellule du planning peut porter un code travail et, en superposition,
// un code événementiel qui vient l'amender (cf. CDC section 3/ "des codes
// horaire évènementiels qui viennent... se superposer sur des codes horaires
// de travail"). Seuls les codes événementiels dotés d'un typeEvenement se
// superposent (CAR/ABI/MAL/AJT) ; les autres (ABA/CP) s'utilisent seuls.
export type ValeurCellule = {
  travail?: string;
  evenementiel?: string;
  // Uniquement pour un évènement de type "complement" : la plage horaire
  // saisie au moment de le positionner sur le planning.
  evenementielPlage?: Plage;
};

export function estCodeSuperposable(code: string): boolean {
  const horaire = HORAIRE_CODES_PAR_CODE[code.toUpperCase()];
  return horaire?.categorie === "evenementiel" && horaire.typeEvenement !== undefined;
}

export function estCodeComplement(code: string): boolean {
  return HORAIRE_CODES_PAR_CODE[code.toUpperCase()]?.typeEvenement === "complement";
}

// Delta (en heures, signé) apporté par un évènement "complement" sur une
// cellule, ou undefined si non applicable — pour l'afficher explicitement
// (+/-) dans l'émargement mensuel, cf. retour client du 17/09.
export function deltaEvenementielCellule(valeur: ValeurCellule): number | undefined {
  if (!valeur.evenementiel || !valeur.evenementielPlage) return undefined;
  const horaireEvenementiel = HORAIRE_CODES_PAR_CODE[valeur.evenementiel.toUpperCase()];
  if (horaireEvenementiel?.typeEvenement !== "complement") return undefined;
  const plagesTravail = valeur.travail ? (HORAIRE_CODES_PAR_CODE[valeur.travail.toUpperCase()]?.plages ?? []) : [];
  return deltaComplementHeures(valeur.evenementielPlage, plagesTravail);
}

export function heuresReellesCellule(valeur: ValeurCellule): number {
  const heuresBase = valeur.travail ? heuresDuCode(valeur.travail) : 0;
  if (!valeur.evenementiel) return heuresBase;
  const horaireEvenementiel = HORAIRE_CODES_PAR_CODE[valeur.evenementiel.toUpperCase()];
  if (horaireEvenementiel?.typeEvenement === "complement") {
    const delta = deltaEvenementielCellule(valeur) ?? 0;
    return Math.max(0, heuresBase + delta);
  }
  switch (horaireEvenementiel?.regleHeures) {
    case "zero":
      return 0;
    case "code_initial":
      return heuresBase;
    case "personnalise":
      return horaireEvenementiel.heuresPersonnalisees ?? 0;
    default:
      return heuresBase;
  }
}
