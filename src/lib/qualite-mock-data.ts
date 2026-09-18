// Données de démonstration — application Qualité (maquette exploratoire).
//
// Contrairement à une première version purement fictive, le contenu DUERP
// (unités de travail, catégories de risques et pictogrammes, risques recensés,
// plan d'action) est repris du DUERP réel de l'EHPAD "Les Jardins de Rambam"
// (version 3, en cours d'élaboration — document non encore finalisé par le
// client, d'où certaines unités de travail ou champs encore incomplets, fidèlement
// reproduits tels quels plutôt qu'inventés). Les libellés d'actions/risques sont
// repris tels quels du document ; seule la catégorisation par pictogramme (page 20
// du DUERP) et l'organe de décision ont été déduits/complétés à partir du contenu
// (mesures de prévention citant COMOP / COPIL Qualité / COVIRIS).
//
// Référentiel qualité HAS resté simplifié à titre illustratif (non fourni par le
// client) : la structure (3 chapitres → thématiques → objectifs → critères, dont
// certains "impératifs") reflète la réalité du référentiel d'évaluation des ESSMS,
// mais le contenu de chaque critère est une reformulation simplifiée, pas une
// citation du manuel officiel.

// ---------- Unités de travail (réelles, cf. DUERP partie 1 §5) ----------

export type UniteTravail = {
  id: string;
  numero: number;
  nom: string;
  professionnelsConcernes: string[];
  couleur: string; // pastille d'accent, reprise (approximativement) du document source
};

export const UNITES_TRAVAIL: UniteTravail[] = [
  { id: "direction", numero: 1, nom: "Direction", professionnelsConcernes: ["Directrice"], couleur: "#e53e3e" },
  {
    id: "astreinte",
    numero: 2,
    nom: "Astreinte",
    professionnelsConcernes: ["Directrice", "Responsables de pôle : maitresse de maison, infirmier référent, attachée de direction"],
    couleur: "#ec4899",
  },
  {
    id: "equipe-direction",
    numero: 3,
    nom: "Équipe de direction",
    professionnelsConcernes: [
      "Directrice",
      "Médecin coordonnateur",
      "Responsables de pôle : maitresse de maison, technicien de maintenance, infirmier référent, psychologue, attachée de direction",
    ],
    couleur: "#f59e0b",
  },
  {
    id: "rh-comptabilite",
    numero: 4,
    nom: "Ressources humaines et comptabilité",
    professionnelsConcernes: ["Directrice", "Attachée de direction"],
    couleur: "#eab308",
  },
  {
    id: "administration",
    numero: 5,
    nom: "Pôle administratif",
    professionnelsConcernes: ["Secrétaires de direction", "Secrétaire médicale"],
    couleur: "#d4c86a",
  },
  {
    id: "maintenance",
    numero: 6,
    nom: "Pôle maintenance",
    professionnelsConcernes: ["Technicien de maintenance"],
    couleur: "#65a30d",
  },
  {
    id: "hotellerie-entretien",
    numero: 7,
    nom: "Pôle hôtellerie — Service entretien",
    professionnelsConcernes: ["Agents de Service Hôtelier (entretien)"],
    couleur: "#16a34a",
  },
  {
    id: "hotellerie-restauration",
    numero: 8,
    nom: "Pôle hôtellerie — Service restauration",
    professionnelsConcernes: ["Agents de Service Hôtelier (restauration)"],
    couleur: "#14b8a6",
  },
  {
    id: "hotellerie-lingerie",
    numero: 9,
    nom: "Pôle hôtellerie — Service lingerie",
    professionnelsConcernes: ["Agents de Service Hôtelier (lingerie)"],
    couleur: "#64748b",
  },
  {
    id: "bien-etre",
    numero: 10,
    nom: "Pôle bien-être",
    professionnelsConcernes: ["Animateurs", "Ergothérapeute - Psychomotricien"],
    couleur: "#38bdf8",
  },
  {
    id: "soins",
    numero: 11,
    nom: "Pôle soins",
    professionnelsConcernes: ["Infirmiers", "Préparatrice en pharmacie", "Aides-Soignants", "Ergothérapeute - Psychomotricien"],
    couleur: "#2563eb",
  },
  {
    id: "equipe-nuit",
    numero: 12,
    nom: "Équipe de nuit",
    professionnelsConcernes: ["Agents de Service Hôtelier", "Aides-Soignants"],
    couleur: "#8b5cf6",
  },
  {
    id: "co-activites",
    numero: 13,
    nom: "Co-activités",
    professionnelsConcernes: ["Bénévoles", "Intervenants extérieurs"],
    couleur: "#9ca3af",
  },
];

// ---------- Catégories de risques (réelles, DUERP partie 1 §6 p.20) ----------

export type CategorieSlug =
  | "physiques"
  | "chute"
  | "biologiques"
  | "chimiques"
  | "psychosociaux"
  | "electrique"
  | "circulation"
  | "equipements"
  | "environnement"
  | "violences"
  | "specifiques";

export type CategorieRisque = {
  slug: CategorieSlug;
  nom: string;
  icone: string; // chemin public, pictogramme extrait du DUERP (p.20)
  exemples: string[];
};

export const CATEGORIES_RISQUE: CategorieRisque[] = [
  {
    slug: "physiques",
    nom: "Physiques",
    icone: "/qualite/icons/physiques.png",
    exemples: ["Manutention de personnes (transfert, repositionnement au lit, aide à la toilette)", "Manutention de charges", "Postures contraignantes"],
  },
  {
    slug: "chute",
    nom: "Chute et glissade",
    icone: "/qualite/icons/chute.png",
    exemples: ["Sols mouillés", "Obstacles", "Escaliers", "Déplacements dans les chambres et couloirs"],
  },
  {
    slug: "biologiques",
    nom: "Biologiques",
    icone: "/qualite/icons/biologiques.png",
    exemples: ["Contacts avec les résidents", "Contact avec des agents infectieux", "Exposition aux sangs et liquides biologiques", "Exposition aux déchets d'activités de soins", "Accidents d'exposition au sang"],
  },
  {
    slug: "chimiques",
    nom: "Chimiques",
    icone: "/qualite/icons/chimiques.png",
    exemples: ["Produits d'entretien", "Produits lessiviels", "Produits de soins", "Médicaments"],
  },
  {
    slug: "psychosociaux",
    nom: "Psychosociaux",
    icone: "/qualite/icons/psychosociaux.png",
    exemples: ["Charge de travail", "Charge émotionnelle", "Organisation du travail", "Travail dans l'urgence", "Conflits", "Confrontation à la souffrance et à la mort"],
  },
  {
    slug: "electrique",
    nom: "Électrique",
    icone: "/qualite/icons/electrique.png",
    exemples: ["Électrocution"],
  },
  {
    slug: "circulation",
    nom: "Circulation routière",
    icone: "/qualite/icons/circulation.png",
    exemples: ["Déplacements professionnels", "Courses", "Transport de résidents"],
  },
  {
    slug: "equipements",
    nom: "Utilisation des équipements",
    icone: "/qualite/icons/equipements.png",
    exemples: ["Lève-personnes, verticalisateurs", "Lits médicalisés", "Chariots", "Matériel de nettoyage"],
  },
  {
    slug: "environnement",
    nom: "Environnement de travail",
    icone: "/qualite/icons/environnement.png",
    exemples: ["Canicule", "Froid"],
  },
  {
    slug: "violences",
    nom: "Violences externes",
    icone: "/qualite/icons/violences.png",
    exemples: ["Agressions verbales", "Agressions physiques", "Comportements de résidents ayant des troubles cognitifs", "Conflits avec les familles"],
  },
  {
    slug: "specifiques",
    nom: "Spécifiques",
    icone: "/qualite/icons/specifiques.png",
    exemples: ["Incendie", "Épidémies", "Travail de nuit", "Travail isolé"],
  },
];

export function categorie(slug: CategorieSlug): CategorieRisque {
  return CATEGORIES_RISQUE.find((c) => c.slug === slug)!;
}

// ---------- Cotation DUERP (réelle, méthode INRS reprise du document p.15-16) ----------
// Gravité (G1 bénin -> G4 grave) x Fréquence (F1 rare -> F4 très fréquente).
// La criticité (1 à 16) est classée en 3 bandes de couleur, non déductibles du seul
// score (ex. G4×F1=4 est vert, G1×F4=4 est orange) : la matrice ci-dessous reprend
// donc la grille couleur exacte du document plutôt qu'un simple seuil numérique.
export type Niveau = 1 | 2 | 3 | 4;

export type NiveauCriticite = "faible" | "moyen" | "eleve";

export const LIBELLES_CRITICITE: Record<NiveauCriticite, string> = {
  faible: "Risque faible",
  moyen: "Risque moyen",
  eleve: "Risque élevé",
};

export const DESCRIPTIONS_CRITICITE: Record<NiveauCriticite, string> = {
  faible: "Risque acceptable (surveillance et maintien des mesures actuelles)",
  moyen: "Mesures de prévention à programmer",
  eleve: "Mesures de prévention à mettre en place rapidement",
};

const MATRICE_CRITICITE: Record<Niveau, Record<Niveau, NiveauCriticite>> = {
  1: { 1: "faible", 2: "faible", 3: "faible", 4: "moyen" },
  2: { 1: "faible", 2: "moyen", 3: "moyen", 4: "moyen" },
  3: { 1: "faible", 2: "moyen", 3: "eleve", 4: "eleve" },
  4: { 1: "faible", 2: "moyen", 3: "eleve", 4: "eleve" },
};

export function criticite(cotation: { gravite: Niveau; frequence: Niveau }): number {
  return cotation.gravite * cotation.frequence;
}

export function niveauCriticite(cotation: { gravite: Niveau; frequence: Niveau }): NiveauCriticite {
  return MATRICE_CRITICITE[cotation.gravite][cotation.frequence];
}

// ---------- Organe de décision ----------
// Repris des mentions effectives dans les mesures de prévention du DUERP :
// COMOP (comité opérationnel, revues hebdomadaires locales), COPIL Qualité
// (comité de pilotage qualité, avec consultante externe) et COVIRIS (comité
// de vigilance et des risques, cf. glossaire p.3 — risques liés aux soins).
export type OrganeDecision = "comop" | "copil" | "coviris";

export const LIBELLES_ORGANE: Record<OrganeDecision, string> = {
  comop: "COMOP",
  copil: "COPIL Qualité",
  coviris: "COVIRIS",
};

export const DESCRIPTIONS_ORGANE: Record<OrganeDecision, string> = {
  comop: "Comité opérationnel — revue hebdomadaire, niveau unité de travail",
  copil: "Comité de pilotage Qualité — pilotage transverse avec consultante qualité externe",
  coviris: "Comité de vigilance et des risques — risques liés aux soins",
};

// ---------- Risques DUERP (réels, un par facteur de risque identifié) ----------

export type Risque = {
  id: string;
  uniteTravailId: string;
  categorie: CategorieSlug;
  phase: string; // "Phase de travail" du document
  intitule: string; // "Facteur de risque"
  situations: string[]; // "Situations à risque"
  dommages: string;
  mesuresExistantes: string[];
  brut: { gravite: Niveau; frequence: Niveau };
  residuel: { gravite: Niveau; frequence: Niveau };
  organeDecision: OrganeDecision;
};

export const RISQUES_DEMO: Risque[] = [
  {
    id: "risque-01",
    uniteTravailId: "direction",
    categorie: "psychosociaux",
    phase: "GLOBAL",
    intitule: "Isolement du poste",
    situations: ["Gestion globale de l’établissement et des parties prenantes", "Respect veille réglementaire"],
    dommages: "Charges mentales, stress, épuisement, burn-out",
    mesuresExistantes: ["Soutien psychologique avec la consultant qualité", "Partenariats avec d’autres directeurs (JM13V, Les IndEHPADants)", "Soutien du syndicat employeur (Synerpa)", "Accompagnement par la médecine du travail", "Accompagnement par le président de la Fondation Rambam"],
    brut: { gravite: 3, frequence: 4 },
    residuel: { gravite: 3, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-02",
    uniteTravailId: "direction",
    categorie: "psychosociaux",
    phase: "COMMUNICATION",
    intitule: "Relations avec les autorités de tutelle",
    situations: ["Restrictions budgétaires", "Augmentation des attendus", "Injonctions paradoxales"],
    dommages: "Charges mentales, stress, épuisement, burn-out",
    mesuresExistantes: ["Instances, comités réunions", "Poste attachée de direction"],
    brut: { gravite: 4, frequence: 4 },
    residuel: { gravite: 4, frequence: 4 },
    organeDecision: "comop",
  },
  {
    id: "risque-03",
    uniteTravailId: "direction",
    categorie: "psychosociaux",
    phase: "GLOBAL",
    intitule: "Contexte législatif contraignant",
    situations: ["Augmentation des couts extérieurs", "Respect veille réglementaire"],
    dommages: "Stress, épuisement, charges mentales",
    mesuresExistantes: ["Soutien psychologique consultant qualité", "Partenariats avec d’autres directeurs (JM13V, Les IndEHPADants)", "Soutien du syndicat employeur (Synerpa)", "Accompagnement médecine du travail"],
    brut: { gravite: 4, frequence: 4 },
    residuel: { gravite: 3, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-04",
    uniteTravailId: "direction",
    categorie: "psychosociaux",
    phase: "COMMUNICATION",
    intitule: "Relations avec les autorités de tutelle",
    situations: ["Gestion de l’établissement et des parties prenantes", "Respect veille réglementaire"],
    dommages: "Stress, épuisement, charges mentales",
    mesuresExistantes: ["Instances, comités réunions"],
    brut: { gravite: 4, frequence: 4 },
    residuel: { gravite: 4, frequence: 4 },
    organeDecision: "comop",
  },
  {
    id: "risque-05",
    uniteTravailId: "astreinte",
    categorie: "psychosociaux",
    phase: "MANAGEMENT ET COORDINATION",
    intitule: "Gestion des absences inopinées",
    situations: ["Gestion des conflits interpersonnels", "Absentéisme des professionnels", "Gestion des plannings"],
    dommages: "Stress, anxiété, difficulté gestion émotionnelle",
    mesuresExistantes: ["PO gestion absentéisme", "PO recrutement", "PO RH", "COMOP tous les lundis matin", "Réunions hebdomadaires d’équipe", "Instances, comités, réunions, soutien psychologique", "Formation management (« manager de proximité », « gestion des priorités »)", "Logiciel du planning", "Pool de remplaçants", "plan bleu"],
    brut: { gravite: 3, frequence: 4 },
    residuel: { gravite: 2, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-06",
    uniteTravailId: "astreinte",
    categorie: "psychosociaux",
    phase: "ASTREINTE",
    intitule: "Management transversal",
    situations: ["Sollicitations multiples multi-service", "Prise de décisions difficiles", "Problème logistique"],
    dommages: "Stress, anxiété, difficulté gestion émotionnelle",
    mesuresExistantes: ["PO problèmes logistiques", "TUTO réparations", "Classeur d’astreinte", "RETEX en COMOP"],
    brut: { gravite: 4, frequence: 1 },
    residuel: { gravite: 3, frequence: 1 },
    organeDecision: "comop",
  },
  {
    id: "risque-07",
    uniteTravailId: "astreinte",
    categorie: "violences",
    phase: "MANAGEMENT ET COORDINATION",
    intitule: "Gestion des situations de crise",
    situations: ["Gestion de crise déclarée", "Plaintes et réclamations, évènements indésirables graves"],
    dommages: "Stress, anxiété",
    mesuresExistantes: ["Plan bleu", "PO plaintes et réclamations", "PO évènements indésirables", "RETEX en COPIL qualité avec consultant externe"],
    brut: { gravite: 4, frequence: 2 },
    residuel: { gravite: 3, frequence: 2 },
    organeDecision: "copil",
  },
  {
    id: "risque-08",
    uniteTravailId: "astreinte",
    categorie: "circulation",
    phase: "ASTREINTE",
    intitule: "Déplacement en astreinte",
    situations: ["Conduite sous fatigue et/ou stress"],
    dommages: "Accident, dommages matériels, dommages corporels",
    mesuresExistantes: ["Plan bleu", "PO problèmes logistiques", "TUTO réparations pour dépanner à distance", "Assurance professionnelle", "Classeur d’astreinte", "RETEX en COMOP"],
    brut: { gravite: 4, frequence: 1 },
    residuel: { gravite: 3, frequence: 1 },
    organeDecision: "comop",
  },
  {
    id: "risque-09",
    uniteTravailId: "equipe-direction",
    categorie: "physiques",
    phase: "GESTION ADMINISTRATIVE",
    intitule: "Travail sur poste informatique",
    situations: ["Position statique prolongée", "Mouvements répétitifs (souris, clavier)", "Posture contraignante devant l’écran", "Travail sur écran"],
    dommages: "TMS, cervicalgies, dorsalgies, syndrome du canal carpien, tendinites, fatigue visuelle, maux de tête",
    mesuresExistantes: ["Pauses régulières conseillées", "Mobilier ergonomique de bureau", "Diversité des taches permettant des pauses régulières", "Amélioration de l’éclairage", "Surélévation des écrans", "Utilisation de la lumière bleue"],
    brut: { gravite: 1, frequence: 4 },
    residuel: { gravite: 1, frequence: 2 },
    organeDecision: "comop",
  },
  {
    id: "risque-10",
    uniteTravailId: "equipe-direction",
    categorie: "violences",
    phase: "COMMUNICATION",
    intitule: "Relations avec les familles",
    situations: ["Agression verbale ou physique", "Gestion des familles mécontentes", "Situation de tension"],
    dommages: "Stress post-traumatique, anxiété, dépression, dommages physiques, burn-out",
    mesuresExistantes: ["Plan bleu", "PO plaintes et réclamations", "PO évènements indésirables", "RETEX en COPIL Qualité"],
    brut: { gravite: 2, frequence: 3 },
    residuel: { gravite: 1, frequence: 3 },
    organeDecision: "copil",
  },
  {
    id: "risque-11",
    uniteTravailId: "equipe-direction",
    categorie: "violences",
    phase: "COMMUNICATION",
    intitule: "Relations avec les résidents",
    situations: ["Agression verbale ou physique", "Gestion des familles mécontentes", "Situation de tension"],
    dommages: "Stress post-traumatique, anxiété, dépression, dommages physiques, burn-out",
    mesuresExistantes: ["Plan bleu", "PO plaintes et réclamations", "PO évènements indésirables", "Présence d’une astreinte 24h/24, 7 j/7", "PO accompagnement fin de vie"],
    brut: { gravite: 2, frequence: 3 },
    residuel: { gravite: 2, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-12",
    uniteTravailId: "equipe-direction",
    categorie: "psychosociaux",
    phase: "MANAGEMENT ET COORDINATION",
    intitule: "Gestion des équipes",
    situations: ["Gestion des conflits interpersonnels", "Absentéisme des professionnels", "Prise de décisions difficiles", "Sollicitations multiples", "Gestion des plannings"],
    dommages: "Stress, conflit interne, difficulté gestion émotionnelle, fatigue psychologique",
    mesuresExistantes: ["PO gestion absentéisme", "PO recrutement", "PO RH", "Réunions d’équipe hebdomadaire", "Instances, comités, réunions, soutien psychologique", "Formation management (« manager de proximité », « gestion des priorités »)"],
    brut: { gravite: 3, frequence: 4 },
    residuel: { gravite: 2, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-13",
    uniteTravailId: "equipe-direction",
    categorie: "violences",
    phase: "MANAGEMENT ET COORDINATION",
    intitule: "Gestion des situations de crise",
    situations: ["Gestion de crise déclarée", "Plaintes et ou réclamations, évènements indésirables graves"],
    dommages: "Stress, anxiété",
    mesuresExistantes: ["Plan bleu", "PO plaintes et réclamations", "PO évènements indésirables", "Présence d’une astreinte 24h/24, 7 j/7", "Soutien psychologique", "RETEX en COPIL Qualité avec consultante qualité externe"],
    brut: { gravite: 4, frequence: 2 },
    residuel: { gravite: 2, frequence: 3 },
    organeDecision: "copil",
  },
  {
    id: "risque-14",
    uniteTravailId: "equipe-direction",
    categorie: "physiques",
    phase: "LOGISTIQUE",
    intitule: "Gestion des fournisseurs et stocks",
    situations: ["Manutention des colis", "Vérification des livraisons", "Déplacement avec charges"],
    dommages: "Douleurs lombaires, chutes, contusions",
    mesuresExistantes: ["Formation gestes et postures", "Aide au déchargement", "Référents de pôles", "PO gestion et achats fournisseurs"],
    brut: { gravite: 3, frequence: 2 },
    residuel: { gravite: 2, frequence: 1 },
    organeDecision: "comop",
  },
  {
    id: "risque-15",
    uniteTravailId: "rh-comptabilite",
    categorie: "psychosociaux",
    phase: "GESTION FINANCIÈRE ET COMPTABLE",
    intitule: "Saisie des données comptables",
    situations: ["Gestion financière résidents", "Gestion financière des professionnels", "Gestion financière des fournisseurs"],
    dommages: "Stress et charge mentale liée aux erreurs potentielles, anxiété, fatigue mentale, troubles du sommeil",
    mesuresExistantes: ["Logiciel avec contrôles automatiques", "Organismes extérieurs avec soutien et formation", "PO gestion des achats et fournisseurs"],
    brut: { gravite: 2, frequence: 3 },
    residuel: { gravite: 2, frequence: 1 },
    organeDecision: "comop",
  },
  {
    id: "risque-16",
    uniteTravailId: "rh-comptabilite",
    categorie: "psychosociaux",
    phase: "GESTION FINANCIÈRE ET COMPTABILITÉ",
    intitule: "PAIE",
    situations: ["Élaboration des bulletins de paie", "Évolution réglementaire permanente", "Respect des délais"],
    dommages: "Stress et charge mentale liée aux erreurs potentielles, anxiété, fatigue mentale, troubles du sommeil",
    mesuresExistantes: ["Logiciel avec contrôles automatiques", "Organismes extérieurs avec soutien et formation", "PO gestion des achats et fournisseurs", "Abonnement à la veille réglementaire"],
    brut: { gravite: 2, frequence: 3 },
    residuel: { gravite: 2, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-17",
    uniteTravailId: "rh-comptabilite",
    categorie: "psychosociaux",
    phase: "GESTION FINANCIÈRE ET COMPTABILITÉ",
    intitule: "Gestion des impayés",
    situations: ["Contact avec familles en difficulté", "Situations conflictuelles", "Stress émotionnel"],
    dommages: "Épuisement émotionnel",
    mesuresExistantes: ["PO de recouvrement", "Formation gestion des conflits", "Suivi des dossiers", "Soutien juridique (avocat)"],
    brut: { gravite: 3, frequence: 3 },
    residuel: { gravite: 2, frequence: 4 },
    organeDecision: "comop",
  },
  {
    id: "risque-18",
    uniteTravailId: "administration",
    categorie: "physiques",
    phase: "GESTION ADMINISTRATIVE",
    intitule: "Travail sur poste informatique",
    situations: ["Position statique prolongée", "Posture de travail sédentaire", "Mouvements répétitifs (souris, clavier)", "Posture contraignante devant l’écran", "Travail sur écran"],
    dommages: "TMS, cervicalgies, dorsalgies, syndrome du canal carpien, tendinites, fatigue visuelle, maux de tête",
    mesuresExistantes: ["Pauses régulières conseillées", "Mobilier ergonomique de bureau", "Diversité des taches permettant des pauses régulières", "Amélioration de l’éclairage", "Surélévation des écrans", "Utilisation de la lumière bleue"],
    brut: { gravite: 1, frequence: 4 },
    residuel: { gravite: 1, frequence: 2 },
    organeDecision: "comop",
  },
  {
    id: "risque-19",
    uniteTravailId: "administration",
    categorie: "violences",
    phase: "COMMUNICATION",
    intitule: "Relations avec les familles et les résidents",
    situations: ["Sollicitations multiples", "Agression verbale ou physique", "Gestion des familles mécontentes", "Situation de tension"],
    dommages: "Stress post-traumatique, anxiété, dépression, dommages physiques, burn-out",
    mesuresExistantes: ["Plan bleu", "PO plaintes et réclamations", "PO évènements indésirables", "RETEX en COPIL Qualité", "Soutien responsable de pôle et astreinte 24h/24, 7j/7"],
    brut: { gravite: 2, frequence: 3 },
    residuel: { gravite: 1, frequence: 3 },
    organeDecision: "copil",
  },
  {
    id: "risque-20",
    uniteTravailId: "administration",
    categorie: "physiques",
    phase: "LOGISTIQUE",
    intitule: "Gestion des fournisseurs et stocks",
    situations: ["Manutention des colis", "Vérification des livraisons", "Déplacement de charges lourdes"],
    dommages: "Douleurs lombaires, chutes, contusions",
    mesuresExistantes: ["Formation gestes et postures", "Aide au déchargement", "Référents de pôles", "PO gestion et achats fournisseurs", "Utilisation de chariots"],
    brut: { gravite: 3, frequence: 2 },
    residuel: { gravite: 2, frequence: 1 },
    organeDecision: "comop",
  },
  {
    id: "risque-21",
    uniteTravailId: "maintenance",
    categorie: "electrique",
    phase: "CIRCUIT DU LINGE",
    intitule: "Utilisation du matériel électrique",
    situations: ["Branchement de matériel électrique défectueux", "Intervention dans les armoires électriques"],
    dommages: "TMS, arrêt de travail, Douleurs physiques",
    mesuresExistantes: ["Habilitation électrique B2 du technicien de maintenance", "Mise au rebut du matériel abimée", "Contrôle annuel par organisme de contrôle", "Utilisation des EPI"],
    brut: { gravite: 3, frequence: 4 },
    residuel: { gravite: 3, frequence: 2 },
    organeDecision: "comop",
  },
  {
    id: "risque-22",
    uniteTravailId: "maintenance",
    categorie: "equipements",
    phase: "ENTRETIEN DES LOCAUX",
    intitule: "Utilisation de l’autolaveuse et autres matériels",
    situations: ["Utilisation de matériels défaillant", "Matériels non ergonomiques"],
    dommages: "TMS, douleurs physiques, arrêt ou accident de travail",
    mesuresExistantes: ["Maintenance du matériel", "Agent technique présent toutes les semaines", "Renouvellement du matériel d’entretien", "Suivi par la maitresse de maison", "Réunions hebdomadaire ASH et maitresse de maison"],
    brut: { gravite: 3, frequence: 3 },
    residuel: { gravite: 3, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-23",
    uniteTravailId: "hotellerie-entretien",
    categorie: "biologiques",
    phase: "ENTRETIEN DES LOCAUX",
    intitule: "Entretien quotidien des chambres et des espaces communs",
    situations: ["Contact surfaces contaminées", "Non-conformité des produits d’entretien"],
    dommages: "Brulure, Irritation, Problèmes cutanées, Problèmes oculaires, Absentéismes, MSP",
    mesuresExistantes: ["EPI adaptés", "FDS pour chaque produit", "Réunion tous les mardis Maitresse de maison et ASH", "PO entretien quotidien", "PO entretien d’une chambre approfondi"],
    brut: { gravite: 3, frequence: 4 },
    residuel: { gravite: 3, frequence: 4 },
    organeDecision: "comop",
  },
  {
    id: "risque-24",
    uniteTravailId: "hotellerie-entretien",
    categorie: "equipements",
    phase: "ENTRETIEN DES LOCAUX",
    intitule: "Utilisation de l’autolaveuse",
    situations: ["Utilisation de matériels défaillant", "Matériels non ergonomiques"],
    dommages: "TMS, douleurs physiques, arrêt ou accident de travail",
    mesuresExistantes: ["Maintenance du matériel", "Agent technique présent toutes les semaines", "Renouvellement du matériel d’entretien", "Suivi par la maitresse de maison", "Réunions hebdomadaire ASH et maitresse de maison"],
    brut: { gravite: 3, frequence: 3 },
    residuel: { gravite: 3, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-25",
    uniteTravailId: "hotellerie-entretien",
    categorie: "biologiques",
    phase: "PLONGE",
    intitule: "Nettoyage et désinfection",
    situations: ["Utilisation de produits chimiques"],
    dommages: "Irritation, problème cutané, brulure",
    mesuresExistantes: ["FDS associés à chaque produit", "Produit d’entretien conforme HACCP", "Validation par la médecine du travail", "Surveillance et gestion des stocks maitresse de maison"],
    brut: { gravite: 3, frequence: 4 },
    residuel: { gravite: 2, frequence: 4 },
    organeDecision: "comop",
  },
  {
    id: "risque-26",
    uniteTravailId: "hotellerie-entretien",
    categorie: "physiques",
    phase: "SERVICE DES REPAS",
    intitule: "Transport des gastro",
    situations: ["Poussée ou traction", "Brûlures"],
    dommages: "TMS, accident de travail",
    mesuresExistantes: ["Chariots ergonomiques", "Entretien hebdomadaire", "Formation des professionnels"],
    brut: { gravite: 3, frequence: 4 },
    residuel: { gravite: 2, frequence: 4 },
    organeDecision: "comop",
  },
  {
    id: "risque-27",
    uniteTravailId: "hotellerie-restauration",
    categorie: "equipements",
    phase: "ENTRETIEN DES LOCAUX",
    intitule: "Utilisation de l’autolaveuse et autres matériels",
    situations: ["Utilisation de matériels défaillant", "Matériels non ergonomiques"],
    dommages: "TMS, douleurs physiques, maladie",
    mesuresExistantes: ["Maintenance du matériel", "Agent technique présent toutes les semaines", "Renouvellement du matériel d’entretien", "Suivi par la maitresse de maison", "Réunions hebdomadaire ASH et maitresse de maison"],
    brut: { gravite: 2, frequence: 3 },
    residuel: { gravite: 1, frequence: 2 },
    organeDecision: "comop",
  },
  {
    id: "risque-28",
    uniteTravailId: "hotellerie-restauration",
    categorie: "physiques",
    phase: "SERVICE DES REPAS",
    intitule: "Transport des gastro",
    situations: ["Poussée ou traction", "Brûlures"],
    dommages: "Brûlures, TMS, maladie",
    mesuresExistantes: ["Chariots ergonomiques", "Entretien hebdomadaire", "Formation des professionnels"],
    brut: { gravite: 2, frequence: 4 },
    residuel: { gravite: 1, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-29",
    uniteTravailId: "hotellerie-restauration",
    categorie: "physiques",
    phase: "SERVICE DES REPAS",
    intitule: "Débarrassage et plonge",
    situations: ["Vaisselle abimée"],
    dommages: "Coupure",
    mesuresExistantes: ["Suivi de la qualité de la vaisselle par la maitresse de maison", "EPI adaptés", "Fiche de tâches pour les ASH et ASH plonge"],
    brut: { gravite: 2, frequence: 4 },
    residuel: { gravite: 2, frequence: 4 },
    organeDecision: "comop",
  },
  {
    id: "risque-30",
    uniteTravailId: "hotellerie-restauration",
    categorie: "biologiques",
    phase: "PLONGE",
    intitule: "Nettoyage et désinfection",
    situations: ["Produits chimiques non HACCP"],
    dommages: "Irritation, problème cutané, brulure",
    mesuresExistantes: ["FDS associés à chaque produit", "Produit d’entretien conforme HACCP", "Validation par la médecine du travail", "Surveillance et gestion des stocks maitresse de maison"],
    brut: { gravite: 3, frequence: 4 },
    residuel: { gravite: 2, frequence: 4 },
    organeDecision: "comop",
  },
  {
    id: "risque-31",
    uniteTravailId: "hotellerie-lingerie",
    categorie: "biologiques",
    phase: "CIRCUIT DU LINGE",
    intitule: "Collecte et tri du linge sale",
    situations: ["Exposition aux agents pathogènes", "Contact direct avec souillures", "Matériels inadaptés"],
    dommages: "Infection, stress, accident ou arrêt maladie",
    mesuresExistantes: ["Mise à disposition d’Équipements de Protection Individuelle (EPI) adaptés", "PO circuit du linge", "Formation précautions standards et complémentaires", "Collaboration EMH", "DAMRI à jour"],
    brut: { gravite: 2, frequence: 4 },
    residuel: { gravite: 2, frequence: 2 },
    organeDecision: "comop",
  },
  {
    id: "risque-32",
    uniteTravailId: "hotellerie-lingerie",
    categorie: "physiques",
    phase: "CIRCUIT DU LINGE",
    intitule: "Manipulation du linge",
    situations: ["Port de charges lourdes", "Gestes répétitifs", "Chariots inadaptés"],
    dommages: "TMS, lombalgies, arrêt de travail",
    mesuresExistantes: ["Matériels ergonomiques adaptés : chariots à fond amovible, chaise de repassage", "Sacs de linge de xx litres", "PO circuit du linge", "Fiche de tâche poste lingerie"],
    brut: { gravite: 3, frequence: 4 },
    residuel: { gravite: 2, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-33",
    uniteTravailId: "hotellerie-lingerie",
    categorie: "chimiques",
    phase: "CIRCUIT DU LINGE",
    intitule: "Utilisation des produits lessiviels",
    situations: ["Contact avec des produits lessiviels", "Changement de bidons"],
    dommages: "Brulure, irritation, problèmes cutanés, problèmes oculaires, accident du travail",
    mesuresExistantes: ["Centrale de gestion automatisée des produits lessiviels", "Mise à disposition d’EPI adaptés", "FDS pour chaque produit", "Réunion hebdomadaire avec la maitresse de maison", "PO circuit du linge", "Présence du technicien de maintenance pour le changement des produits"],
    brut: { gravite: 3, frequence: 1 },
    residuel: { gravite: 1, frequence: 1 },
    organeDecision: "comop",
  },
  {
    id: "risque-34",
    uniteTravailId: "hotellerie-lingerie",
    categorie: "biologiques",
    phase: "CIRCUIT DU LINGE",
    intitule: "Nettoyage et désinfection de la lingerie",
    situations: ["Utilisation de produits chimiques", "Contact avec des surfaces contaminées"],
    dommages: "Brulure, irritation, problèmes cutanés, problèmes oculaires, accident du travail",
    mesuresExistantes: ["Centrale de dilution des produits", "Mise à disposition d’EPI adaptés", "FDS associés à chaque produit", "Réunion hebdomadaire avec la maitresse de maison", "Protocole « entretien quotidien des espaces de travail »", "Audits réalisés par la maitresse de maison pour suivi des protocoles"],
    brut: { gravite: 2, frequence: 3 },
    residuel: { gravite: 1, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-35",
    uniteTravailId: "hotellerie-lingerie",
    categorie: "equipements",
    phase: "CIRCUIT DU LINGE",
    intitule: "Utilisation du fer à repasser",
    situations: ["Utilisation de matériels défaillant", "Matériels non ergonomiques"],
    dommages: "Brûlure, accident de travail",
    mesuresExistantes: ["Maintenance du matériel", "Renouvellement du matériel d’entretien", "Rappel des consignes de sécurité", "Réunions hebdomadaire ASH et maitresse de maison"],
    brut: { gravite: 2, frequence: 4 },
    residuel: { gravite: 2, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-36",
    uniteTravailId: "hotellerie-lingerie",
    categorie: "psychosociaux",
    phase: "CIRCUIT DU LINGE",
    intitule: "Absorption de la charge de travail",
    situations: ["Charge mentale face à la quantité de linge à traiter"],
    dommages: "Stress",
    mesuresExistantes: ["Mise en place de machines de grande capacité", "Aide apportée par le service entretien", "Réunions hebdomadaire avec la maitresse de maison"],
    brut: { gravite: 1, frequence: 3 },
    residuel: { gravite: 1, frequence: 2 },
    organeDecision: "comop",
  },
  {
    id: "risque-37",
    uniteTravailId: "hotellerie-lingerie",
    categorie: "environnement",
    phase: "GÉNÉRAL",
    intitule: "Ambiance sonore",
    situations: ["Exposition de longue durée en salle des machines"],
    dommages: "Maux de tête, surdité",
    mesuresExistantes: ["Mise à disposition d’EPI (bouchons d’oreille)", "Porte de séparation en salle des machines"],
    brut: { gravite: 2, frequence: 4 },
    residuel: { gravite: 1, frequence: 1 },
    organeDecision: "comop",
  },
  {
    id: "risque-38",
    uniteTravailId: "hotellerie-lingerie",
    categorie: "environnement",
    phase: "CIRCUIT DU LINGE",
    intitule: "Travail isolé",
    situations: [],
    dommages: "Brûlure, accident de travail",
    mesuresExistantes: ["Maintenance du matériel", "Renouvellement du matériel d’entretien", "Rappel des consignes de sécurité", "Réunions hebdomadaire ASH et maitresse de maison"],
    brut: { gravite: 2, frequence: 4 },
    residuel: { gravite: 2, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-39",
    uniteTravailId: "bien-etre",
    categorie: "physiques",
    phase: "ANIMATION COLLECTIVE",
    intitule: "Manipulation de matériels",
    situations: ["Port de charges lourdes et installation de matériels", "Matériels inadaptés"],
    dommages: "Lombalgies, TMS",
    mesuresExistantes: ["Stockage dans un local dédié", "Matériel stocké sur chariot sur roulettes par ateliers"],
    brut: { gravite: 2, frequence: 4 },
    residuel: { gravite: 1, frequence: 2 },
    organeDecision: "comop",
  },
  {
    id: "risque-40",
    uniteTravailId: "bien-etre",
    categorie: "psychosociaux",
    phase: "ANIMATION COLLECTIVE",
    intitule: "Sortie extérieure",
    situations: ["Mauvaise organisation", "Manque d’apport hydrique et nutritif", "Rupture des soins"],
    dommages: "Stress, négligence, évènements indésirables",
    mesuresExistantes: ["Protocoles et fiches techniques ateliers, activités, animations", "Sensibilisation et réunions hebdomadaires animées par la psychologue", "Accompagnement des animateurs par un professionnel soignant"],
    brut: { gravite: 3, frequence: 2 },
    residuel: { gravite: 3, frequence: 1 },
    organeDecision: "comop",
  },
  {
    id: "risque-41",
    uniteTravailId: "bien-etre",
    categorie: "electrique",
    phase: "ANIMATION COLLECTIVE",
    intitule: "Utilisation du matériel électrique",
    situations: [],
    dommages: "Électrocution",
    mesuresExistantes: ["Plan de maintenance du matériel", "Remplacement du matériel dès que cela est nécessaire"],
    brut: { gravite: 3, frequence: 2 },
    residuel: { gravite: 3, frequence: 1 },
    organeDecision: "comop",
  },
  {
    id: "risque-42",
    uniteTravailId: "bien-etre",
    categorie: "psychosociaux",
    phase: "ANIMATION INDIVIDUELLE",
    intitule: "Accompagnement des résidents",
    situations: ["Confrontation résidents / professionnels"],
    dommages: "Charge émotionnelle, stress",
    mesuresExistantes: ["Formations et sensibilisations", "Protocole CAA", "Activités flash", "Coordination avec la psychologue", "Planning adapté aux compétences du professionnel"],
    brut: { gravite: 1, frequence: 4 },
    residuel: { gravite: 1, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-43",
    uniteTravailId: "soins",
    categorie: "physiques",
    phase: "PRISE EN SOINS DES RÉSIDENTS",
    intitule: "Soins d’hygiène et de nursing",
    situations: ["Manutention des résidents", "Postures contraignantes", "Matériels non adaptés"],
    dommages: "Lombalgies, TMS, douleurs physiques, arrêt de travail",
    mesuresExistantes: ["PO soins nursings", "Formation manutention", "EPI adapté", "Matériel d’aide à la manutention (lève-malades, verticalisateurs, disques de transfert)", "Soins d’hygiène et de nursing en binôme pour les résidents « lourds »", "Accompagnement par IDE et IDER", "Maintenance du matériel par une entreprise extérieure"],
    brut: { gravite: 4, frequence: 4 },
    residuel: { gravite: 3, frequence: 4 },
    organeDecision: "comop",
  },
  {
    id: "risque-44",
    uniteTravailId: "soins",
    categorie: "specifiques",
    phase: "PRISES EN SOINS DES RÉSIDENTS",
    intitule: "Administration des médicaments",
    situations: ["Erreur de distribution", "Interruptions indésirables graves"],
    dommages: "Anxiété, fatigue mentale, stress chronique",
    mesuresExistantes: ["Logiciel de soins", "PO circuit du médicament avec formation", "COVIRIS", "Transmissions quotidiennes écrites sur le logiciel de soins", "Sensibilisations régulières par l’IDER et le MEDCO"],
    brut: { gravite: 4, frequence: 4 },
    residuel: { gravite: 2, frequence: 3 },
    organeDecision: "coviris",
  },
  {
    id: "risque-45",
    uniteTravailId: "soins",
    categorie: "psychosociaux",
    phase: "SOINS DES RÉSIDENTS",
    intitule: "Gestion des urgences",
    situations: ["Décisions rapides nécessaires", "Situations de crise", "Décès"],
    dommages: "Anxiété, épuisement professionnel",
    mesuresExistantes: ["Plan bleu", "PO et FT d’urgence associés aux soins", "Soutien de l’IDER et de l’astreinte"],
    brut: { gravite: 3, frequence: 2 },
    residuel: { gravite: 2, frequence: 1 },
    organeDecision: "comop",
  },
  {
    id: "risque-46",
    uniteTravailId: "soins",
    categorie: "biologiques",
    phase: "PRISE EN SOINS DES RÉSIDENTS",
    intitule: "Exposition aux agents biologiques",
    situations: ["Contact avec des fluides biologiques", "Expositions aux maladies infectieuses", "Soins contaminants", "Utilisation d’outils coupants, perforants, piquants"],
    dommages: "Stress, anxiété, arrêt maladie",
    mesuresExistantes: ["EPI adaptés", "PO associés aux risques infectieux", "DAMRI", "Formation aux précautions standards", "Campagne vaccination", "Matériel à usage unique", "Seringues sécurisées", "Consultation des transmissions à chaque prise de poste"],
    brut: { gravite: 4, frequence: 4 },
    residuel: { gravite: 3, frequence: 4 },
    organeDecision: "comop",
  },
  {
    id: "risque-47",
    uniteTravailId: "soins",
    categorie: "environnement",
    phase: "COMMUNE",
    intitule: "Risques liés à l’environnement et aux équipements",
    situations: ["Problème de température interne", "Matériels non adaptés", "Mauvais éclairage", "Pas d’EPI"],
    dommages: "Accident de travail, Stress, Douleurs physiques, Perte de motivation",
    mesuresExistantes: ["Équipements ergonomiques", "Renouvellement du matériel dès usure", "Agent technique", "Contrôle des locaux et visite d’organismes agrées"],
    brut: { gravite: 4, frequence: 4 },
    residuel: { gravite: 3, frequence: 4 },
    organeDecision: "comop",
  },
  {
    id: "risque-48",
    uniteTravailId: "soins",
    categorie: "psychosociaux",
    phase: "SOINS DES RÉSIDENTS",
    intitule: "Gestion de situations difficiles",
    situations: ["Accompagnement des fins de vie", "Décès"],
    dommages: "Stress, anxiété, épuisement professionnel, maladie",
    mesuresExistantes: ["Groupe de parole", "PO décès", "PO soins palliatifs", "Soutien des responsables de pôles et de l’astreinte 24H/24, 7J/7", "Formation « accompagnement des personnes en fin de vie »"],
    brut: { gravite: 2, frequence: 2 },
    residuel: { gravite: 1, frequence: 2 },
    organeDecision: "comop",
  },
  {
    id: "risque-49",
    uniteTravailId: "soins",
    categorie: "violences",
    phase: "COMMUNICATION",
    intitule: "Gestion des familles et des résidents",
    situations: ["Contestation d'une famille par rapport aux soins prodigués", "Violence : plainte ou réclamation"],
    dommages: "Stress, anxiété, arrêt maladie",
    mesuresExistantes: ["Plan bleu", "PO et FT d’urgence associés aux soins", "Soutien responsables de pôles", "Soutien astreinte 24H/24, 7j/7", "PO plaintes et réclamations", "PO évènements indésirables", "Groupe de parole animé par la psychologue", "Passage de relais"],
    brut: { gravite: 3, frequence: 1 },
    residuel: { gravite: 2, frequence: 1 },
    organeDecision: "comop",
  },
  {
    id: "risque-50",
    uniteTravailId: "soins",
    categorie: "psychosociaux",
    phase: "COMMUNICATION",
    intitule: "Absence de salariés",
    situations: ["Nombre de personnel insuffisant"],
    dommages: "Stress, anxiété",
    mesuresExistantes: ["Plan bleu", "PO et FT procédures dégradées", "Soutien responsables de pôles", "Soutien astreinte 24H/24, 7j/7", "Toute absence est remplacée"],
    brut: { gravite: 2, frequence: 3 },
    residuel: { gravite: 2, frequence: 2 },
    organeDecision: "comop",
  },
  {
    id: "risque-51",
    uniteTravailId: "equipe-nuit",
    categorie: "environnement",
    phase: "GÉNÉRAL",
    intitule: "Travail isolé",
    situations: ["Nombre restreint de professionnels", "Responsabilité accrue"],
    dommages: "Stress, anxiété, charge mentale",
    mesuresExistantes: ["Présence de 4 salariés de nuit"],
    brut: { gravite: 1, frequence: 4 },
    residuel: { gravite: 1, frequence: 2 },
    organeDecision: "comop",
  },
  {
    id: "risque-52",
    uniteTravailId: "equipe-nuit",
    categorie: "psychosociaux",
    phase: "COMMUNICATION",
    intitule: "Gestion des urgences de nuit",
    situations: ["Diagnostic"],
    dommages: "Stress, anxiété, charge mentale",
    mesuresExistantes: ["Dispositif d’IDE mutualisée de nuit", "PO urgences"],
    brut: { gravite: 2, frequence: 3 },
    residuel: { gravite: 1, frequence: 3 },
    organeDecision: "comop",
  },
  {
    id: "risque-53",
    uniteTravailId: "equipe-nuit",
    categorie: "violences",
    phase: "MANAGEMENT ET COORDINATION",
    intitule: "Gestion des situations de crise",
    situations: ["Gestion de crise déclarée", "Plaintes et ou réclamations, évènements indésirables graves"],
    dommages: "Stress, anxiété",
    mesuresExistantes: ["Plan bleu", "PO plaintes et réclamations", "PO évènements indésirables", "Présence d’une astreinte 24h/24, 7 j/7", "Soutien psychologique", "RETEX en COPIL Qualité avec consultante qualité externe"],
    brut: { gravite: 4, frequence: 2 },
    residuel: { gravite: 2, frequence: 3 },
    organeDecision: "copil",
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
//
// La partie DUERP reprend telle quelle la table "Plan d'action des mesures de
// prévention à mettre en œuvre" du document réel (page 27) : 6 lignes numérotées
// N°26-01 à 26-06, dont 2 (26-02, 26-03) sont encore vides dans le document
// source ("en cours d'élaboration") — reproduites ici comme actions "à définir"
// plutôt qu'inventées.

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
  origineId: string; // Risque.id / "cat:<slug>" / "global" (duerp) ou Critere.id (has)
  intitule: string;
  responsable: string;
  echeance: string; // ISO, pour tri/retard
  echeanceLabel?: string; // affichage si différent (ex. "2026-T4")
  statut: StatutAction;
  organeDecision: OrganeDecision;
};

export const ACTIONS_DEMO: ActionQualite[] = [
  {
    id: "duerp-26-01",
    origine: "duerp",
    origineId: "global",
    intitule: "Nommer et former un relai de prévention",
    responsable: "Directrice",
    echeance: "2026-12-31",
    echeanceLabel: "2026 — T4",
    statut: "a_faire",
    organeDecision: "copil",
  },
  {
    id: "duerp-26-02",
    origine: "duerp",
    origineId: "cat:physiques",
    intitule: "Mesures de prévention à définir (risques physiques)",
    responsable: "À définir",
    echeance: "2027-12-31",
    echeanceLabel: "À définir",
    statut: "a_faire",
    organeDecision: "copil",
  },
  {
    id: "duerp-26-03",
    origine: "duerp",
    origineId: "cat:chute",
    intitule: "Mesures de prévention à définir (chute et glissade)",
    responsable: "À définir",
    echeance: "2027-12-31",
    echeanceLabel: "À définir",
    statut: "a_faire",
    organeDecision: "copil",
  },
  {
    id: "duerp-26-04",
    origine: "duerp",
    origineId: "cat:specifiques",
    intitule:
      "Risque attentat : élaborer le protocole « intrusion ou attentat », mettre en place les moyens d'alerte et de communication, faire des exercices de simulation",
    responsable: "Directrice",
    echeance: "2026-12-31",
    echeanceLabel: "2026 — T4",
    statut: "a_faire",
    organeDecision: "copil",
  },
  {
    id: "duerp-26-05",
    origine: "duerp",
    origineId: "cat:specifiques",
    intitule:
      "Risque incendie : organiser l'alerte, l'évacuation et/ou la mise à l'abri des résidents et des professionnels (identification des rôles et responsabilités en cas d'incendie)",
    responsable: "Directrice",
    echeance: "2026-12-31",
    echeanceLabel: "2026 — T4",
    statut: "a_faire",
    organeDecision: "copil",
  },
  {
    id: "duerp-26-06",
    origine: "duerp",
    origineId: "cat:psychosociaux",
    intitule: "Programmer des formations « gestion du stress »",
    responsable: "À définir",
    echeance: "2027-12-31",
    echeanceLabel: "À définir",
    statut: "a_faire",
    organeDecision: "copil",
  },
  {
    id: "has-a1",
    origine: "has",
    origineId: "cr2",
    intitule: "Planifier les révisions annuelles de projet personnalisé dans le calendrier IDEC",
    responsable: "IDEC",
    echeance: "2026-09-30",
    statut: "en_cours",
    organeDecision: "copil",
  },
  {
    id: "has-a2",
    origine: "has",
    origineId: "cr4",
    intitule: "Déployer une grille d'évaluation du risque de chute à l'entrée de chaque résident",
    responsable: "Médecin coordonnateur",
    echeance: "2026-07-15",
    statut: "a_faire",
    organeDecision: "copil",
  },
  {
    id: "has-a3",
    origine: "has",
    origineId: "cr6",
    intitule: "Publier le DUERP mis à jour et son plan d'action sur l'affichage obligatoire",
    responsable: "Direction",
    echeance: "2026-02-28",
    statut: "fait",
    organeDecision: "copil",
  },
];
