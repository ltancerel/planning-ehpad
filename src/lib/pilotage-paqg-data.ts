// Données et utilitaires fictifs pour la maquette Pilotage PAQG (EPIC #46,
// story #47) — cf. cahier des charges fourni par le client (artefact
// "Pilotage PAQG — Cahier des charges"). Sous-ensemble du fichier Excel
// source (6 items sur 4 instances, plutôt que les 50 réels) : suffisant
// pour illustrer les 3 types de fréquence et la gestion documentaire, sans
// surcharger la maquette.

export type FrequenceType = "an" | "mois" | "semaine";

export const LABELS_FREQUENCE: Record<FrequenceType, string> = {
  an: "/ an",
  mois: "/ mois",
  semaine: "/ semaine",
};

export type ItemPilotage = {
  id: string;
  code: string;
  nomComplet?: string;
  responsable: string;
  frequenceType: FrequenceType;
  frequenceN: number;
  moisAnticipes?: number[]; // 0 = janvier ... 11 = décembre, uniquement pour "an"
  gestionDocumentaire: boolean;
  documentCompteConformite: boolean; // n'a de sens que si gestionDocumentaire
};

export type InstancePilotage = {
  id: string;
  nom: string;
  items: ItemPilotage[];
};

export const ANNEE = 2026;
// Mois en cours exclu du calcul de conformité (cf. cahier des charges) —
// novembre, pour avoir à la fois des mois passés (conformité calculable)
// et des mois à venir dans la grille.
export const MOIS_COURANT = 10;

export const MOIS_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export const INSTANCES_DEMO: InstancePilotage[] = [
  {
    id: "comites",
    nom: "Instances - Comités - Commissions",
    items: [
      {
        id: "codir",
        code: "CODIR",
        nomComplet: "Comité de Direction",
        responsable: "Directrice",
        frequenceType: "an",
        frequenceN: 10,
        moisAnticipes: [0, 1, 2, 3, 4, 5, 8, 9, 10, 11], // tous sauf juillet/août
        gestionDocumentaire: true,
        documentCompteConformite: true,
      },
      {
        id: "coviris",
        code: "COVIRIS",
        nomComplet: "Comité des Vigilances et des Risques",
        responsable: "IDER",
        frequenceType: "an",
        frequenceN: 4,
        moisAnticipes: [1, 3, 5, 10],
        gestionDocumentaire: false,
        documentCompteConformite: false,
      },
    ],
  },
  {
    id: "reunions",
    nom: "Réunions",
    items: [
      {
        id: "ash-entretien",
        code: "ASH - pôle entretien",
        responsable: "Maîtresse de maison",
        frequenceType: "semaine",
        frequenceN: 1,
        gestionDocumentaire: false,
        documentCompteConformite: false,
      },
      {
        id: "chutes",
        code: "Chutes",
        responsable: "IDER",
        frequenceType: "mois",
        frequenceN: 1,
        gestionDocumentaire: true,
        documentCompteConformite: false,
      },
    ],
  },
  {
    id: "audit",
    nom: "Audit",
    items: [
      {
        id: "guide-bientraitance",
        code: "Guide bientraitance",
        responsable: "Psychologue",
        frequenceType: "an",
        frequenceN: 1,
        moisAnticipes: [8],
        gestionDocumentaire: true,
        documentCompteConformite: true,
      },
    ],
  },
  {
    id: "sensibilisation",
    nom: "Sensibilisation",
    items: [
      {
        id: "risques-chimiques",
        code: "Risques chimiques",
        responsable: "Maîtresse de maison",
        frequenceType: "an",
        frequenceN: 1,
        moisAnticipes: [2],
        gestionDocumentaire: false,
        documentCompteConformite: false,
      },
    ],
  },
];

export type EvenementPilotage = {
  id: string;
  itemId: string;
  date: string; // ISO yyyy-mm-dd — pour "semaine", le lundi de la semaine concernée
  reference?: string;
};

// Quelques évènements déjà saisis, pour que la grille et le bandeau ne
// démarrent pas totalement vides (cf. CODIR dans l'exemple du fichier
// source : janvier et février déjà tenus).
export const EVENEMENTS_DEMO: EvenementPilotage[] = [
  { id: "ev1", itemId: "codir", date: "2026-01-08", reference: "CR-CODIR-2026-01.pdf" },
  { id: "ev2", itemId: "codir", date: "2026-02-09", reference: "CR-CODIR-2026-02.pdf" },
  { id: "ev3", itemId: "codir", date: "2026-03-10" }, // référence manquante → non conforme
  { id: "ev4", itemId: "coviris", date: "2026-02-18" },
  { id: "ev5", itemId: "chutes", date: "2026-01-20", reference: "Audit-chutes-janvier.pdf" },
  { id: "ev6", itemId: "chutes", date: "2026-02-17" },
  { id: "ev7", itemId: "risques-chimiques", date: "2026-03-05" },
];

// Tous les lundis d'un mois donné, chacun rattaché au mois où tombe sa
// date (convention la plus simple : pas de semaine à cheval sur 2 mois).
export function lundisDuMois(annee: number, moisIndex0: number): Date[] {
  const lundis: Date[] = [];
  const dernierJour = new Date(annee, moisIndex0 + 1, 0).getDate();
  for (let jour = 1; jour <= dernierJour; jour++) {
    const d = new Date(annee, moisIndex0, jour);
    if (d.getDay() === 1) lundis.push(d);
  }
  return lundis;
}

// d doit avoir été construit en heure locale (ex. new Date(annee, mois,
// jour)) : toISOString() convertirait en UTC et pourrait décaler le jour
// d'une unité selon le fuseau horaire du serveur.
export function dateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${j}`;
}

// Extraction directe depuis une chaîne ISO "yyyy-mm-dd" — ne jamais passer
// par `new Date(chaineISO)` pour en tirer le mois/jour, qui parse en UTC et
// peut décaler la date d'un jour selon le fuseau horaire du serveur.
export function moisDeISO(iso: string): number {
  return Number(iso.slice(5, 7)) - 1;
}

export function jourDeISO(iso: string): number {
  return Number(iso.slice(8, 10));
}

export function formatDateFR(iso: string): string {
  const [y, m, j] = iso.split("-").map(Number);
  return new Date(y, m - 1, j).toLocaleDateString("fr-FR");
}

export function toutesLesInstances(): InstancePilotage[] {
  return INSTANCES_DEMO;
}

export function tousLesItems(): ItemPilotage[] {
  return INSTANCES_DEMO.flatMap((i) => i.items);
}

export function tousLesResponsables(): string[] {
  return [...new Set(tousLesItems().map((i) => i.responsable))].sort((a, b) => a.localeCompare(b, "fr"));
}

// Un évènement est conforme s'il n'a pas de contrainte documentaire liée à
// la conformité, ou s'il en a une et qu'une référence a été saisie.
export function evenementConforme(item: ItemPilotage, evenement: EvenementPilotage): boolean {
  if (!item.gestionDocumentaire || !item.documentCompteConformite) return true;
  return Boolean(evenement.reference?.trim());
}

// Attendu/réalisé pour un item, sur les mois écoulés avant moisLimite
// (mois en cours exclu, cf. cahier des charges).
export function statsItem(
  item: ItemPilotage,
  evenements: EvenementPilotage[],
  moisLimite: number
): { attendu: number; realise: number } {
  const evenementsItem = evenements.filter((e) => e.itemId === item.id);

  if (item.frequenceType === "an") {
    const moisAttendus = (item.moisAnticipes ?? []).filter((m) => m < moisLimite);
    const realise = moisAttendus.filter((m) =>
      evenementsItem.some((e) => {
        const d = new Date(e.date);
        return d.getMonth() === m && evenementConforme(item, e);
      })
    ).length;
    return { attendu: moisAttendus.length, realise };
  }

  if (item.frequenceType === "mois") {
    let realise = 0;
    for (let m = 0; m < moisLimite; m++) {
      if (evenementsItem.some((e) => new Date(e.date).getMonth() === m && evenementConforme(item, e))) realise++;
    }
    return { attendu: moisLimite, realise };
  }

  // "semaine"
  let attendu = 0;
  let realise = 0;
  for (let m = 0; m < moisLimite; m++) {
    const lundis = lundisDuMois(ANNEE, m);
    attendu += lundis.length;
    for (const lundi of lundis) {
      const iso = dateISO(lundi);
      if (evenementsItem.some((e) => e.date === iso && evenementConforme(item, e))) realise++;
    }
  }
  return { attendu, realise };
}

export function conformitePourcentage(items: ItemPilotage[], evenements: EvenementPilotage[], moisLimite: number): number {
  let attendu = 0;
  let realise = 0;
  for (const item of items) {
    const stats = statsItem(item, evenements, moisLimite);
    attendu += stats.attendu;
    realise += stats.realise;
  }
  if (attendu === 0) return 100;
  return Math.round((realise / attendu) * 100);
}
