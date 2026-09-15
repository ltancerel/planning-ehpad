// Jours fériés fixes systématiques (mêmes jour/mois chaque année) — cf. CDC
// "1er janvier, 1er mai, 8 mai, ...".
export const JOURS_FERIES_FIXES = [
  { jour: 1, mois: 1, label: "Jour de l'An" },
  { jour: 1, mois: 5, label: "Fête du Travail" },
  { jour: 8, mois: 5, label: "Victoire 1945" },
  { jour: 14, mois: 7, label: "Fête nationale" },
  { jour: 15, mois: 8, label: "Assomption" },
  { jour: 1, mois: 11, label: "Toussaint" },
  { jour: 11, mois: 11, label: "Armistice" },
  { jour: 25, mois: 12, label: "Noël" },
];

export function genererJoursFeriesFixes(annee: number): { date: Date; label: string }[] {
  return JOURS_FERIES_FIXES.map(({ jour, mois, label }) => ({
    date: new Date(annee, mois - 1, jour),
    label,
  }));
}

// Jours fériés configurables : dépendent de Pâques (date mobile), donc calculés
// plutôt que saisis à la main — cf. CDC "des jours fériés configurables
// (Ascension, ...)". Algorithme de Meeus/Jones/Butcher (calendrier grégorien).
export function calculerPaques(annee: number): Date {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(annee, mois - 1, jour);
}

function ajouterJours(date: Date, nbJours: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + nbJours);
  return d;
}

export function genererJoursFeriesConfigurables(annee: number): { date: Date; label: string }[] {
  const paques = calculerPaques(annee);
  return [
    { date: ajouterJours(paques, 1), label: "Lundi de Pâques" },
    { date: ajouterJours(paques, 39), label: "Ascension" },
    { date: ajouterJours(paques, 50), label: "Lundi de Pentecôte" },
  ];
}

export function estAnneeBissextile(annee: number): boolean {
  return (annee % 4 === 0 && annee % 100 !== 0) || annee % 400 === 0;
}
