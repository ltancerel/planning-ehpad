import type { ValeurCellule } from "./horaire-codes";
import { formatDateISO, genererPeriode } from "./dates";
import { genererJoursFeriesFixes, genererJoursFeriesConfigurables } from "./jours-feries";

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

export type Manager = "Aucun" | "Maîtresse de maison" | "IDEC";
export const MANAGERS: Manager[] = ["Aucun", "Maîtresse de maison", "IDEC"];

export type FicheSalarie = {
  id: string;
  matricule: string; // 4 lettres majuscules
  nom: string;
  prenom: string;
  service: string;
  typeContrat: "CDD" | "CDI";
  contratActif: boolean;
  manager: Manager;
  presence: "Présent" | "Absent";
};

// Fiches salariés de démo (noms fictifs, cf. décision de ne jamais utiliser de
// vraies identités dans les données de démonstration).
export const FICHES_SALARIES_DEMO: FicheSalarie[] = [
  {
    id: "fs1",
    matricule: "CBRD",
    nom: "BERNARD",
    prenom: "Claire",
    service: "ADMINISTRATIF",
    typeContrat: "CDI",
    contratActif: true,
    manager: "Aucun",
    presence: "Présent",
  },
  {
    id: "fs2",
    matricule: "LINS",
    nom: "LAURENT",
    prenom: "Inès",
    service: "ASH CDD",
    typeContrat: "CDD",
    contratActif: true,
    manager: "IDEC",
    presence: "Présent",
  },
  {
    id: "fs3",
    matricule: "DUPM",
    nom: "DUPONT",
    prenom: "Marie",
    service: "ADMINISTRATIF",
    typeContrat: "CDI",
    contratActif: true,
    manager: "Aucun",
    presence: "Présent",
  },
  {
    id: "fs4",
    matricule: "MARJ",
    nom: "MARTIN",
    prenom: "Julie",
    service: "ADMINISTRATIF",
    typeContrat: "CDI",
    contratActif: true,
    manager: "Aucun",
    presence: "Présent",
  },
  {
    id: "fs5",
    matricule: "DURS",
    nom: "DURAND",
    prenom: "Sophie",
    service: "ADMINISTRATIF",
    typeContrat: "CDI",
    contratActif: true,
    manager: "Aucun",
    presence: "Absent",
  },
  {
    id: "fs6",
    matricule: "PETL",
    nom: "PETIT",
    prenom: "Léa",
    service: "ASH CDD",
    typeContrat: "CDD",
    contratActif: true,
    manager: "IDEC",
    presence: "Présent",
  },
  {
    id: "fs7",
    matricule: "ROBE",
    nom: "ROBERT",
    prenom: "Emma",
    service: "ASH CDD",
    typeContrat: "CDD",
    contratActif: true,
    manager: "IDEC",
    presence: "Présent",
  },
  {
    id: "fs8",
    matricule: "RICC",
    nom: "RICHARD",
    prenom: "Chloé",
    service: "ASH CDD",
    typeContrat: "CDD",
    contratActif: false,
    manager: "IDEC",
    presence: "Absent",
  },
  {
    id: "fs9",
    matricule: "DUBC",
    nom: "DUBOIS",
    prenom: "Camille",
    service: "ASH CDD",
    typeContrat: "CDD",
    contratActif: true,
    manager: "IDEC",
    presence: "Présent",
  },
  {
    id: "fs10",
    matricule: "MORL",
    nom: "MOREAU",
    prenom: "Lucas",
    service: "ASH CDD",
    typeContrat: "CDD",
    contratActif: true,
    manager: "IDEC",
    presence: "Absent",
  },
  {
    id: "fs11",
    matricule: "SIMM",
    nom: "SIMON",
    prenom: "Manon",
    service: "IDE",
    typeContrat: "CDI",
    contratActif: true,
    manager: "Maîtresse de maison",
    presence: "Présent",
  },
  {
    id: "fs12",
    matricule: "MICA",
    nom: "MICHEL",
    prenom: "Anna",
    service: "IDE",
    typeContrat: "CDI",
    contratActif: false,
    manager: "Maîtresse de maison",
    presence: "Absent",
  },
];

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

export const ROULEMENTS_DEMO: Roulement[] = [
  {
    id: "r1",
    nom: "ASH matin/soir (2 semaines)",
    nbSemaines: 2,
    motif: [
      ["60S", "60S", "60S", "60S", "60S", "", ""],
      ["70A", "70A", "70A", "70A", "70A", "", ""],
    ],
  },
  {
    id: "r2",
    nom: "IDE fixe (1 semaine)",
    nbSemaines: 1,
    motif: [["SEC", "SEC", "SEC", "SEC", "SEC", "", ""]],
  },
  {
    id: "r3",
    nom: "Administratif (4 semaines)",
    nbSemaines: 4,
    motif: [
      ["SEC", "SEC", "SEC", "SEC", "SEC", "", ""],
      ["SEC", "SEC", "SEC", "SEC", "", "", ""],
      ["OK", "OK", "OK", "OK", "OK", "", ""],
      ["OK", "OK", "OK", "OK", "", "", ""],
    ],
  },
];

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

// Historique des affectations par salarié (clé = FicheSalarie.id). Un salarié
// sans entrée n'a jamais eu de roulement assigné.
export const AFFECTATIONS_ROULEMENT_DEMO: Record<string, AffectationRoulement[]> = {
  fs1: [
    { id: "aff1", roulementId: "r2", dateDebut: "2025-01-06", dateFin: "2025-05-25" },
    { id: "aff2", roulementId: "r1", dateDebut: "2025-06-02" },
  ],
  fs4: [{ id: "aff3", roulementId: "r3", dateDebut: "2025-06-02" }],
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

// Pont temporaire entre les deux représentations du salarié dans cette
// maquette (clé = Salarie.id de la vue Planning, valeur = FicheSalarie.id de
// l'admin) : cf. point ouvert "deux représentations distinctes du salarié".
// Couvre désormais tous les salariés réels (hors lignes "Besoin", qui n'ont
// pas de fiche) pour permettre à la grille Planning de retrouver le
// roulement actuel d'un salarié ET son contrat/présence (cf. story #19 —
// filtre d'affichage), en attendant l'unification des deux modèles au vrai
// backend.
export const CORRESPONDANCE_SALARIE_FICHE_DEMO: Record<string, string> = {
  "1": "fs3", // DUPONT Marie
  "2": "fs4", // MARTIN Julie
  "3": "fs1", // BERNARD Claire
  "4": "fs5", // DURAND Sophie
  "8": "fs6", // PETIT Léa
  "9": "fs7", // ROBERT Emma
  "10": "fs8", // RICHARD Chloé
  "11": "fs9", // DUBOIS Camille
  "12": "fs10", // MOREAU Lucas
  "13": "fs2", // LAURENT Inès
  "14": "fs11", // SIMON Manon
  "15": "fs12", // MICHEL Anna
};

// Fiche salarié (contrat/présence) d'un salarié de la vue Planning, via le
// pont ci-dessus — undefined pour un salarié sans fiche (ex. lignes
// "Besoin", qui ne sont pas de vrais salariés).
export function ficheDuSalarie(salarieId: string): FicheSalarie | undefined {
  const ficheId = CORRESPONDANCE_SALARIE_FICHE_DEMO[salarieId];
  return ficheId ? FICHES_SALARIES_DEMO.find((f) => f.id === ficheId) : undefined;
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

// Année déjà planifiée dans la démo (cohérente avec les jours fériés utilisés
// dans la vue Planning).
export const ANNEES_DEMO: AnneePlanifiee[] = [
  {
    id: "a2026",
    annee: 2026,
    jourDemarrage: "2026-01-01",
    joursFeries: genererJoursFeriesDefaut(2026),
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
// Codes évènementiels "special"/"normal" (se superposent à un code travail
// déjà présent, cf. redéfinition du 23/09 — un évènementiel ne s'applique
// jamais sur une cellule vide). Les codes "partiel" (ABT/HSP/CARP) exigent
// une ou plusieurs plages saisies à la volée, non générées aléatoirement ici
// — cf. EXEMPLES_EMARGEMENT plus bas pour des cas déterministes.
const CODES_EVENEMENTIEL_SUPERPOSABLE_DEMO = ["CP", "MAL", "CARJ", "ABA", "ABI"];

export function genererPlanningDemo(salaries: Salarie[], dates: string[]): Record<string, ValeurCellule> {
  const rng = seedAleatoire(42);
  const planning: Record<string, ValeurCellule> = {};
  for (const salarie of salaries) {
    for (const date of dates) {
      const tirage = rng();
      if (tirage < 0.12) continue; // jamais remplie

      const cle = `${salarie.id}__${date}`;
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

// Exemples déterministes d'évènements sur septembre 2026 (mois par défaut de
// la vue émargement), forcés après la génération aléatoire pour garantir la
// présence des différents cas sur chaque salarié : mêmes dates/codes pour
// tous (retour client du 17/09 : "dupliquer la même vue pour chaque salarié,
// je n'ai pas besoin de plusieurs exemples").
const EXEMPLE_TRAVAIL = "70A"; // 07:00-13:00 / 14:00-19:00
const EXEMPLES_EMARGEMENT: { date: string; valeur: ValeurCellule }[] = [
  // "special" : le travail est effacé de l'affichage (pleine cellule CP/MAL)
  // mais ses heures restent comptées (retour client du 23/09).
  { date: "2026-09-03", valeur: { travail: EXEMPLE_TRAVAIL, evenementiel: "CP" } }, // congés
  { date: "2026-09-08", valeur: { travail: EXEMPLE_TRAVAIL, evenementiel: "MAL" } }, // maladie
  // "normal" : le travail reste visible mais barré, remplacé par la durée
  // propre du code évènementiel (ABI : 0h).
  { date: "2026-09-10", valeur: { travail: EXEMPLE_TRAVAIL, evenementiel: "ABI" } }, // absence injustifiée
  {
    date: "2026-09-15",
    valeur: {
      travail: EXEMPLE_TRAVAIL,
      evenementiel: "ABT",
      evenementielPlages: [{ debut: "07:00", fin: "09:00" }], // absence temporaire (heures en moins)
    },
  },
  {
    date: "2026-09-22",
    valeur: {
      travail: EXEMPLE_TRAVAIL,
      evenementiel: "HSP",
      // Heures supplémentaires sur 2 plages le même jour (retour client du
      // 22/09 : un complément à la volée peut porter plusieurs plages).
      evenementielPlages: [
        { debut: "06:00", fin: "07:00" },
        { debut: "19:00", fin: "21:00" },
      ],
    },
  },
  // Code informatif : jamais d'heures propres. En dessous du travail s'il y
  // en a un (24/09), en pleine case sinon (25/09) — cf. retour client du 23/09.
  { date: "2026-09-24", valeur: { travail: EXEMPLE_TRAVAIL, informatif: "ABS" } },
  { date: "2026-09-25", valeur: { informatif: "." } },
];
for (const salarie of SALARIES.filter((s) => s.service !== SERVICE_BESOINS)) {
  for (const { date, valeur } of EXEMPLES_EMARGEMENT) {
    PLANNING_DEMO[`${salarie.id}__${date}`] = valeur;
  }
}
