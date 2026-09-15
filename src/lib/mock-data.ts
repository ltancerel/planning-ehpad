import type { ValeurCellule } from "./horaire-codes";
import { formatDateISO, genererPeriode } from "./dates";

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

export type Utilisateur = {
  id: string;
  identifiant: string; // 3 lettres majuscules
  nom: string;
  prenom: string;
  email: string;
  typeUtilisateur: "Administrateur" | "Utilisateur";
  service: string;
  poste: string;
};

// Utilisateurs de démo (noms/emails fictifs — cf. décision de ne jamais utiliser
// de vraies identités dans les données de démonstration).
export const UTILISATEURS_DEMO: Utilisateur[] = [
  {
    id: "u1",
    identifiant: "TMO",
    nom: "MOREL",
    prenom: "Thomas",
    email: "thomas.morel@example.fr",
    typeUtilisateur: "Administrateur",
    service: "ADMINISTRATIF",
    poste: "Direction",
  },
  {
    id: "u2",
    identifiant: "SLA",
    nom: "LAMBERT",
    prenom: "Sophie",
    email: "sophie.lambert@example.fr",
    typeUtilisateur: "Utilisateur",
    service: "IDE",
    poste: "Infirmière coordinatrice",
  },
];

export const SERVICES_ORDRE = ["ADMINISTRATIF", "ASH BESOINS", "ASH CDD", "IDE"];

// Service exclusivement composé de lignes "Besoin" non attachées à un salarié
// réel, utilisées pour signaler des besoins à couvrir (cf. CDC). Leurs cellules
// restent vides dans les données de démo (voir genererPlanningDemo plus bas).
export const SERVICE_BESOINS = "ASH BESOINS";

// Noms volontairement génériques (patronymes les plus courants en France) pour
// bien signaler des données fictives et éviter toute homonymie avec un salarié réel.
export const SALARIES: Salarie[] = [
  { id: "1", nom: "DUPONT", prenom: "Marie", service: "ADMINISTRATIF" },
  { id: "2", nom: "MARTIN", prenom: "Julie", service: "ADMINISTRATIF" },
  { id: "3", nom: "BERNARD", prenom: "Claire", service: "ADMINISTRATIF" },
  { id: "4", nom: "DURAND", prenom: "Sophie", service: "ADMINISTRATIF" },
  { id: "5", nom: "BESOIN", prenom: "ASH 1", service: SERVICE_BESOINS },
  { id: "6", nom: "BESOIN", prenom: "ASH 2", service: SERVICE_BESOINS },
  { id: "7", nom: "BESOIN", prenom: "ASH 3", service: SERVICE_BESOINS },
  { id: "8", nom: "PETIT", prenom: "Léa", service: "ASH CDD" },
  { id: "9", nom: "ROBERT", prenom: "Emma", service: "ASH CDD" },
  { id: "10", nom: "RICHARD", prenom: "Chloé", service: "ASH CDD" },
  { id: "11", nom: "DUBOIS", prenom: "Camille", service: "ASH CDD" },
  { id: "12", nom: "MOREAU", prenom: "Lucas", service: "ASH CDD" },
  { id: "13", nom: "LAURENT", prenom: "Inès", service: "ASH CDD" },
  { id: "14", nom: "SIMON", prenom: "Manon", service: "IDE" },
  { id: "15", nom: "MICHEL", prenom: "Anna", service: "IDE" },
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

// Données de démo générées une seule fois sur une plage fixe, indépendante de la
// période actuellement affichée (permet de naviguer librement sans "trous").
// S'arrête fin septembre 2026 : le mois suivant (octobre) reste vide pour qu'un
// utilisateur puisse s'y projeter et planifier librement pendant la démo.
// Partagées entre la vue planning et la vue émargement pour rester cohérentes.
export const DEMO_DEBUT = new Date(2025, 0, 1);
export const DEMO_FIN = new Date(2026, 8, 30);
const DEMO_NB_JOURS = Math.round((DEMO_FIN.getTime() - DEMO_DEBUT.getTime()) / (24 * 60 * 60 * 1000)) + 1;
export const PLANNING_DEMO = genererPlanningDemo(
  SALARIES.filter((s) => s.service !== SERVICE_BESOINS),
  genererPeriode(DEMO_DEBUT, DEMO_NB_JOURS).map(formatDateISO)
);
