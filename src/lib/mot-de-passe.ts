// Règles de mot de passe actées story #24 (BACKLOG, issue #24) : longueur
// minimale 8, au moins un caractère spécial, et un indicateur de
// robustesse qui doit être au vert avant validation — le format seul ne
// suffit pas, pour écarter les mots de passe trivialement faibles malgré
// un format valide (ex. "12345678!").

const SEQUENCES = [
  "0123456789",
  "abcdefghijklmnopqrstuvwxyz",
  "azertyuiop", // clavier FR
  "qwertyuiop", // clavier EN
];

function contientSequenceTriviale(motDePasse: string): boolean {
  const minuscule = motDePasse.toLowerCase();
  return SEQUENCES.some((sequence) => {
    for (let i = 0; i <= sequence.length - 4; i++) {
      const fragment = sequence.slice(i, i + 4);
      if (minuscule.includes(fragment) || minuscule.includes([...fragment].reverse().join(""))) {
        return true;
      }
    }
    return false;
  });
}

function nombreClassesCaracteres(motDePasse: string): number {
  let classes = 0;
  if (/[a-z]/.test(motDePasse)) classes++;
  if (/[A-Z]/.test(motDePasse)) classes++;
  if (/[0-9]/.test(motDePasse)) classes++;
  if (/[^a-zA-Z0-9]/.test(motDePasse)) classes++;
  return classes;
}

export type NiveauRobustesse = "faible" | "moyen" | "fort";

export function evaluerRobustesse(motDePasse: string): NiveauRobustesse {
  if (motDePasse.length < 8 || contientSequenceTriviale(motDePasse)) return "faible";
  const score = nombreClassesCaracteres(motDePasse) + (motDePasse.length >= 12 ? 1 : 0);
  if (score >= 4) return "fort";
  if (score >= 3) return "moyen";
  return "faible";
}

// « doit passer au vert avant validation » : seul le niveau le plus haut
// (fort) est accepté, pas juste "pas faible".
export function motDePasseValide(motDePasse: string): boolean {
  return motDePasse.length >= 8 && /[^a-zA-Z0-9]/.test(motDePasse) && evaluerRobustesse(motDePasse) === "fort";
}
