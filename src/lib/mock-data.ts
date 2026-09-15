import type { ValeurCellule } from "./horaire-codes";

export type Salarie = {
  id: string;
  nom: string;
  prenom: string;
  service: string;
};

export type ProfilUtilisateur = {
  nom: string;
  prenom: string;
  typeUtilisateur: "Administrateur" | "Utilisateur";
  service: string;
  poste: string;
};

// Utilisateur connecté (mock — pas d'authentification réelle à ce stade)
export const UTILISATEUR_CONNECTE: ProfilUtilisateur = {
  nom: "Hontaa",
  prenom: "Virginie",
  typeUtilisateur: "Administrateur",
  service: "Administration",
  poste: "Direction",
};

export const SERVICES_ORDRE = ["ADMINISTRATIF", "ASH BESOINS", "ASH CDD", "IDE"];

// Service exclusivement composé de lignes "Besoin" non attachées à un salarié
// réel, utilisées pour signaler des besoins à couvrir (cf. CDC). Leurs cellules
// restent vides dans les données de démo (voir genererPlanningDemo plus bas).
export const SERVICE_BESOINS = "ASH BESOINS";

export const SALARIES: Salarie[] = [
  { id: "1", nom: "ADMIN", prenom: "Sarah", service: "ADMINISTRATIF" },
  { id: "2", nom: "BOSS", prenom: "Valentine", service: "ADMINISTRATIF" },
  { id: "3", nom: "BOUAOUICHE", prenom: "Sarah", service: "ADMINISTRATIF" },
  { id: "4", nom: "CAPOULADE", prenom: "Mathilde", service: "ADMINISTRATIF" },
  { id: "5", nom: "BESOIN", prenom: "ASH 1", service: SERVICE_BESOINS },
  { id: "6", nom: "BESOIN", prenom: "ASH 2", service: SERVICE_BESOINS },
  { id: "7", nom: "BESOIN", prenom: "ASH 3", service: SERVICE_BESOINS },
  { id: "8", nom: "HORPMI", prenom: "Adriana", service: "ASH CDD" },
  { id: "9", nom: "JORGE", prenom: "Khadija", service: "ASH CDD" },
  { id: "10", nom: "ABDELOUHAB", prenom: "Myriam", service: "ASH CDD" },
  { id: "11", nom: "AMMAR", prenom: "Qatar", service: "ASH CDD" },
  { id: "12", nom: "BARI", prenom: "Mohamed", service: "ASH CDD" },
  { id: "13", nom: "BARI", prenom: "Salwa", service: "ASH CDD" },
  { id: "14", nom: "DIABY", prenom: "Hanatou", service: "IDE" },
  { id: "15", nom: "DIABY", prenom: "Salimatou", service: "IDE" },
].sort((a, b) => {
  const serviceOrdre = SERVICES_ORDRE.indexOf(a.service) - SERVICES_ORDRE.indexOf(b.service);
  if (serviceOrdre !== 0) return serviceOrdre;
  return a.nom.localeCompare(b.nom) || a.prenom.localeCompare(b.prenom);
});

// Jours fériés fixes 2026 (à titre de démo)
export const JOURS_FERIES_2026 = new Set([
  "2026-01-01",
  "2026-05-01",
  "2026-05-08",
  "2026-05-14",
  "2026-05-25",
  "2026-07-14",
  "2026-08-15",
  "2026-11-01",
  "2026-11-11",
  "2026-12-25",
]);

function seedAleatoire(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    return x / 0x7fffffff;
  };
}

const CODES_TRAVAIL_DEMO = ["60S", "70A", "185", "SEC", "OK", "."];
// CAR/ABI/MAL se superposent à un code travail (cf. CDC) ; CP s'utilise seul.
const CODES_EVENEMENTIEL_SUPERPOSABLE_DEMO = ["CAR", "MAL", "ABI"];
const CODES_AUTONOMES_DEMO = ["CP"];

export function genererPlanningDemo(salaries: Salarie[], dates: string[]): Record<string, ValeurCellule> {
  const rng = seedAleatoire(42);
  const planning: Record<string, ValeurCellule> = {};
  for (const salarie of salaries) {
    for (const date of dates) {
      const tirage = rng();
      if (tirage < 0.12) continue; // jamais remplie

      const cle = `${salarie.id}__${date}`;
      if (tirage < 0.2) {
        const code = CODES_AUTONOMES_DEMO[Math.floor(rng() * CODES_AUTONOMES_DEMO.length)];
        planning[cle] = { travail: code };
        continue;
      }

      const travail = CODES_TRAVAIL_DEMO[Math.floor(rng() * CODES_TRAVAIL_DEMO.length)];
      if (rng() < 0.15) {
        const evenementiel =
          CODES_EVENEMENTIEL_SUPERPOSABLE_DEMO[Math.floor(rng() * CODES_EVENEMENTIEL_SUPERPOSABLE_DEMO.length)];
        planning[cle] = { travail, evenementiel };
      } else {
        planning[cle] = { travail };
      }
    }
  }
  return planning;
}
