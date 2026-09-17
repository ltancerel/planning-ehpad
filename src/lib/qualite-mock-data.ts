// Données de démonstration — application Qualité (maquette exploratoire).
// Noms/emails fictifs, cf. décision de ne jamais utiliser de vraies identités
// dans les données de démonstration.
//
// Référentiel HAS simplifié à titre illustratif : la structure (3 chapitres →
// thématiques → objectifs → critères, dont certains "impératifs") reflète la
// réalité du référentiel d'évaluation des ESSMS, mais le contenu de chaque
// critère est une reformulation simplifiée, pas une citation du manuel officiel.

// ---------- DUERP ----------

export type UniteTravail = {
  id: string;
  nom: string;
};

export const UNITES_TRAVAIL: UniteTravail[] = [
  { id: "ut1", nom: "Soins / accompagnement" },
  { id: "ut2", nom: "Hébergement / vie quotidienne" },
  { id: "ut3", nom: "Restauration" },
  { id: "ut4", nom: "Blanchisserie / hygiène des locaux" },
  { id: "ut5", nom: "Administratif" },
];

export type CategorieRisque =
  | "Physique"
  | "Chimique"
  | "Biologique"
  | "Psychosocial"
  | "Ergonomique"
  | "Organisationnel";

export const CATEGORIES_RISQUE: CategorieRisque[] = [
  "Physique",
  "Chimique",
  "Biologique",
  "Psychosocial",
  "Ergonomique",
  "Organisationnel",
];

// Cotation INRS (ED 887) : Gravité (G1 bénin -> G4 mortel) x Fréquence
// (F1 rare -> F4 permanente) = Criticité.
export type Niveau = 1 | 2 | 3 | 4;

export type Risque = {
  id: string;
  uniteTravailId: string;
  categorie: CategorieRisque;
  intitule: string;
  description: string;
  gravite: Niveau;
  frequence: Niveau;
  mesuresExistantes: string;
  dateEvaluation: string; // ISO
};

export function criticite(r: Pick<Risque, "gravite" | "frequence">): number {
  return r.gravite * r.frequence;
}

export type NiveauCriticite = "faible" | "moderee" | "elevee" | "critique";

export function niveauCriticite(score: number): NiveauCriticite {
  if (score >= 12) return "critique";
  if (score >= 6) return "elevee";
  if (score >= 3) return "moderee";
  return "faible";
}

export const RISQUES_DEMO: Risque[] = [
  {
    id: "r1",
    uniteTravailId: "ut1",
    categorie: "Ergonomique",
    intitule: "Manutention manuelle des résidents",
    description:
      "Aide au transfert (lit/fauteuil, verticalisation) exposant à des troubles musculo-squelettiques.",
    gravite: 3,
    frequence: 4,
    mesuresExistantes: "Lève-personnes disponibles, formation gestes et postures réalisée en 2025.",
    dateEvaluation: "2026-01-15",
  },
  {
    id: "r2",
    uniteTravailId: "ut1",
    categorie: "Psychosocial",
    intitule: "Charge émotionnelle / épuisement professionnel",
    description:
      "Exposition répétée à la fin de vie, à l'agressivité de certains résidents, effectifs tendus.",
    gravite: 3,
    frequence: 3,
    mesuresExistantes: "Groupes de parole trimestriels, ligne d'écoute psychologique externe.",
    dateEvaluation: "2026-01-15",
  },
  {
    id: "r3",
    uniteTravailId: "ut1",
    categorie: "Biologique",
    intitule: "Exposition à des agents infectieux",
    description: "Contact avec fluides biologiques, gale, infections respiratoires saisonnières.",
    gravite: 2,
    frequence: 3,
    mesuresExistantes: "Protocole d'hygiène des mains, EPI à disposition, vaccination proposée.",
    dateEvaluation: "2026-01-15",
  },
  {
    id: "r4",
    uniteTravailId: "ut4",
    categorie: "Chimique",
    intitule: "Exposition aux produits d'entretien et désinfectants",
    description: "Manipulation quotidienne de produits irritants/corrosifs (détergents, désinfectants).",
    gravite: 2,
    frequence: 4,
    mesuresExistantes: "Fiches de données de sécurité affichées, gants fournis.",
    dateEvaluation: "2026-01-10",
  },
  {
    id: "r5",
    uniteTravailId: "ut2",
    categorie: "Physique",
    intitule: "Chute de plain-pied",
    description: "Sols glissants (nettoyage en cours, salles d'eau), couloirs encombrés.",
    gravite: 2,
    frequence: 2,
    mesuresExistantes: "Panneaux de signalisation sol mouillé.",
    dateEvaluation: "2026-01-10",
  },
  {
    id: "r6",
    uniteTravailId: "ut3",
    categorie: "Ergonomique",
    intitule: "Port de charges en cuisine",
    description: "Port de bacs/marmites, station debout prolongée.",
    gravite: 2,
    frequence: 3,
    mesuresExistantes: "Diable disponible, mais peu utilisé en pratique.",
    dateEvaluation: "2026-01-10",
  },
  {
    id: "r7",
    uniteTravailId: "ut5",
    categorie: "Organisationnel",
    intitule: "Surcharge administrative liée aux astreintes",
    description: "Gestion des plannings et astreintes concentrée sur peu de personnes.",
    gravite: 1,
    frequence: 3,
    mesuresExistantes: "Aucune mesure formalisée à ce jour.",
    dateEvaluation: "2026-01-10",
  },
];

// ---------- Référentiel qualité HAS (simplifié, illustratif) ----------

export type Chapitre = {
  id: string;
  numero: number;
  nom: string;
};

export const CHAPITRES_HAS: Chapitre[] = [
  { id: "c1", numero: 1, nom: "La personne accompagnée" },
  { id: "c2", numero: 2, nom: "Les professionnels" },
  { id: "c3", numero: 3, nom: "La gouvernance et le pilotage" },
];

export type Thematique = {
  id: string;
  chapitreId: string;
  nom: string;
};

export const THEMATIQUES_HAS: Thematique[] = [
  { id: "t1", chapitreId: "c1", nom: "Le projet d'accueil et d'accompagnement personnalisé" },
  { id: "t2", chapitreId: "c1", nom: "La prévention des risques liés à la santé" },
  { id: "t3", chapitreId: "c2", nom: "La qualité de vie au travail des professionnels" },
  { id: "t4", chapitreId: "c3", nom: "La gestion des risques et la démarche qualité" },
];

export type Objectif = {
  id: string;
  thematiqueId: string;
  numero: string;
  libelle: string;
};

export const OBJECTIFS_HAS: Objectif[] = [
  { id: "o1", thematiqueId: "t1", numero: "1.1", libelle: "Le consentement et la participation de la personne sont recherchés" },
  { id: "o2", thematiqueId: "t2", numero: "2.1", libelle: "Les risques de maltraitance sont prévenus et traités" },
  { id: "o3", thematiqueId: "t2", numero: "2.2", libelle: "Le risque de chute est prévenu" },
  { id: "o4", thematiqueId: "t3", numero: "3.1", libelle: "Les conditions de travail des professionnels sont préservées" },
  { id: "o5", thematiqueId: "t4", numero: "4.1", libelle: "Le document unique d'évaluation des risques est actualisé" },
  { id: "o6", thematiqueId: "t4", numero: "4.2", libelle: "Les événements indésirables sont analysés et donnent lieu à des actions" },
];

export type NiveauCotation = "conforme" | "partiellement_conforme" | "non_conforme" | "non_concerne";

export const LIBELLES_COTATION: Record<NiveauCotation, string> = {
  conforme: "Conforme",
  partiellement_conforme: "Partiellement conforme",
  non_conforme: "Non conforme",
  non_concerne: "Non concerné",
};

export type Critere = {
  id: string;
  objectifId: string;
  numero: string;
  libelle: string;
  imperatif: boolean;
  cotation: NiveauCotation;
};

export const CRITERES_HAS: Critere[] = [
  {
    id: "cr1",
    objectifId: "o1",
    numero: "1.1.1",
    libelle: "Le projet personnalisé formalise les attentes et le consentement de la personne",
    imperatif: false,
    cotation: "conforme",
  },
  {
    id: "cr2",
    objectifId: "o1",
    numero: "1.1.2",
    libelle: "Le projet personnalisé est révisé au moins annuellement avec la personne",
    imperatif: false,
    cotation: "partiellement_conforme",
  },
  {
    id: "cr3",
    objectifId: "o2",
    numero: "2.1.1",
    libelle: "Une procédure de signalement des situations de maltraitance est connue de tous les professionnels",
    imperatif: true,
    cotation: "conforme",
  },
  {
    id: "cr4",
    objectifId: "o3",
    numero: "2.2.1",
    libelle: "Une évaluation individuelle du risque de chute est réalisée à l'entrée et réactualisée",
    imperatif: true,
    cotation: "non_conforme",
  },
  {
    id: "cr5",
    objectifId: "o4",
    numero: "3.1.1",
    libelle: "Les professionnels bénéficient d'un dispositif de soutien face aux situations difficiles",
    imperatif: false,
    cotation: "conforme",
  },
  {
    id: "cr6",
    objectifId: "o5",
    numero: "4.1.1",
    libelle: "Le document unique d'évaluation des risques professionnels est actualisé et son plan d'action suivi",
    imperatif: true,
    cotation: "partiellement_conforme",
  },
  {
    id: "cr7",
    objectifId: "o6",
    numero: "4.2.1",
    libelle: "Les événements indésirables graves font l'objet d'une analyse et d'un plan d'action correctif",
    imperatif: true,
    cotation: "conforme",
  },
];

// ---------- Plan d'action unifié (DUERP + référentiel HAS) ----------

export type OrigineAction = "duerp" | "has";
export type StatutAction = "a_faire" | "en_cours" | "fait";

export const LIBELLES_STATUT: Record<StatutAction, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  fait: "Fait",
};

export type ActionQualite = {
  id: string;
  origine: OrigineAction;
  origineId: string; // Risque.id (duerp) ou Critere.id (has)
  intitule: string;
  responsable: string;
  echeance: string; // ISO
  statut: StatutAction;
};

export const ACTIONS_DEMO: ActionQualite[] = [
  {
    id: "a1",
    origine: "duerp",
    origineId: "r1",
    intitule: "Réévaluer le parc de lève-personnes et planifier un rappel de formation gestes et postures",
    responsable: "IDEC",
    echeance: "2026-10-15",
    statut: "en_cours",
  },
  {
    id: "a2",
    origine: "duerp",
    origineId: "r2",
    intitule: "Mettre en place un groupe de parole mensuel (au lieu de trimestriel)",
    responsable: "Psychologue",
    echeance: "2026-08-31",
    statut: "a_faire",
  },
  {
    id: "a3",
    origine: "duerp",
    origineId: "r7",
    intitule: "Formaliser une procédure de répartition des astreintes",
    responsable: "Direction",
    echeance: "2026-11-30",
    statut: "a_faire",
  },
  {
    id: "a4",
    origine: "has",
    origineId: "cr2",
    intitule: "Planifier les révisions annuelles de projet personnalisé dans le calendrier IDEC",
    responsable: "IDEC",
    echeance: "2026-09-30",
    statut: "en_cours",
  },
  {
    id: "a5",
    origine: "has",
    origineId: "cr4",
    intitule: "Déployer une grille d'évaluation du risque de chute à l'entrée de chaque résident",
    responsable: "Médecin coordonnateur",
    echeance: "2026-07-15",
    statut: "a_faire",
  },
  {
    id: "a6",
    origine: "has",
    origineId: "cr6",
    intitule: "Publier le DUERP mis à jour et son plan d'action sur l'affichage obligatoire",
    responsable: "Direction",
    echeance: "2026-02-28",
    statut: "fait",
  },
];
