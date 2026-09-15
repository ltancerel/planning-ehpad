const JOURS_LETTRE = ["L", "Ma", "M", "J", "V", "S", "D"];

export function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function lettreJour(date: Date): string {
  const jourISO = (date.getDay() + 6) % 7; // 0 = lundi
  return JOURS_LETTRE[jourISO];
}

export function estWeekend(date: Date): boolean {
  const jour = date.getDay();
  return jour === 0 || jour === 6;
}

export function formatJourMois(date: Date): string {
  const jj = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${jj}/${mm}`;
}

export function lundiDeLaSemaine(date: Date): Date {
  const d = new Date(date);
  const jour = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - jour);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function genererPeriode(dateDebut: Date, nbJours: number): Date[] {
  const jours: Date[] = [];
  for (let i = 0; i < nbJours; i++) {
    const d = new Date(dateDebut);
    d.setDate(d.getDate() + i);
    jours.push(d);
  }
  return jours;
}
