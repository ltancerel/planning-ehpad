export type HoraireCategorie = "travail" | "informatif" | "evenementiel" | "special";

export type Plage = { debut: string; fin: string };

export type RegleHeuresEvenement = "zero" | "code_initial" | "personnalise";

export type HoraireCode = {
  code: string;
  intitule: string;
  categorie: HoraireCategorie;
  couleurFond: string;
  couleurTexte: string;
  commentaire?: string;
  plages?: Plage[];
  // Champs spécifiques aux codes événementiels (se superposent à un code de travail)
  action?: string;
  regleHeures?: RegleHeuresEvenement;
  heuresPersonnalisees?: number;
};

export function dureeHeures(plages: Plage[] = []): number {
  return plages.reduce((total, { debut, fin }) => {
    const [hd, md] = debut.split(":").map(Number);
    const [hf, mf] = fin.split(":").map(Number);
    if (hd === 0 && md === 0 && hf === 0 && mf === 0) return total;
    const minutesDebut = hd * 60 + md;
    let minutesFin = hf * 60 + mf;
    if (minutesFin <= minutesDebut) minutesFin += 24 * 60; // plage traversant minuit
    return total + (minutesFin - minutesDebut) / 60;
  }, 0);
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

  // Horaires événementiels (se superposent à un code de travail)
  {
    code: "CAR",
    intitule: "Carence maladie",
    categorie: "evenementiel",
    couleurFond: "#ef4444",
    couleurTexte: "#ffffff",
    action: "Se superpose au code horaire",
    regleHeures: "zero",
  },
  {
    code: "ABI",
    intitule: "Absence injustifiée",
    categorie: "evenementiel",
    couleurFond: "#dc2626",
    couleurTexte: "#ffffff",
    action: "Se superpose au code horaire",
    regleHeures: "zero",
  },
  {
    code: "MAL",
    intitule: "Maladie",
    categorie: "evenementiel",
    couleurFond: "#f97316",
    couleurTexte: "#ffffff",
    action: "Se superpose au code horaire",
    regleHeures: "code_initial",
  },
  { code: "ABA", intitule: "Congé sans solde", categorie: "evenementiel", couleurFond: "#a1a1aa", couleurTexte: "#ffffff" },
  { code: "CP", intitule: "Congés", categorie: "evenementiel", couleurFond: "#60a5fa", couleurTexte: "#1e3a8a" },
];

export const HORAIRE_CODES_PAR_CODE: Record<string, HoraireCode> = Object.fromEntries(
  HORAIRE_CODES.map((h) => [h.code.toUpperCase(), h])
);

export function heuresDuCode(code: string): number {
  const horaire = HORAIRE_CODES_PAR_CODE[code.toUpperCase()];
  if (!horaire?.plages) return 0;
  return dureeHeures(horaire.plages);
}
