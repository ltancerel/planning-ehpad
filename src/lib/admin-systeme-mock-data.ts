// Données de démo pour le rôle Administrateur Système (supervision globale,
// tous établissements confondus — cf. Synthèse fonctionnelle, partie
// "Comptes & applications"). Modèle séparé de mock-data.ts, qui reste scopé
// à un seul établissement (celui de la démo Planning/Admin).

export type Application = "Planning" | "Qualité";
export const APPLICATIONS: Application[] = ["Planning", "Qualité"];

export type Etablissement = {
  id: string;
  nom: string;
  ville: string;
  statut: "actif" | "inactif";
  applications: Application[];
  dateCreation: string; // ISO
};

// Établissements fictifs (cf. décision de ne jamais utiliser de vraies
// identités dans les données de démonstration). Le premier reprend le nom
// par défaut utilisé dans la démo Planning/Admin (EhpadProvider).
export const ETABLISSEMENTS_DEMO: Etablissement[] = [
  {
    id: "et1",
    nom: "Les Jardins de Rambam",
    ville: "Créteil",
    statut: "actif",
    applications: ["Planning"],
    dateCreation: "2025-01-06",
  },
  {
    id: "et2",
    nom: "Résidence du Parc",
    ville: "Lyon",
    statut: "actif",
    applications: ["Planning", "Qualité"],
    dateCreation: "2025-03-12",
  },
  {
    id: "et3",
    nom: "Les Tilleuls",
    ville: "Nantes",
    statut: "actif",
    applications: ["Planning"],
    dateCreation: "2025-06-01",
  },
  {
    id: "et4",
    nom: "Villa Beauséjour",
    ville: "Bordeaux",
    statut: "inactif",
    applications: [],
    dateCreation: "2024-11-20",
  },
];

// Administrateurs d'établissement (compte "Administrateur", cf. Synthèse
// fonctionnelle) créés depuis la console système — distincts des comptes
// "Utilisateur" gérés dans l'admin de chaque établissement.
export type AdministrateurEtablissement = {
  id: string;
  etablissementId: string;
  nom: string;
  prenom: string;
  email: string;
};

export const ADMINISTRATEURS_DEMO: AdministrateurEtablissement[] = [
  { id: "ad1", etablissementId: "et1", nom: "Hontaa", prenom: "Virginie", email: "virginie.hontaa@example.fr" },
  { id: "ad2", etablissementId: "et2", nom: "Lefevre", prenom: "Marc", email: "marc.lefevre@example.fr" },
  { id: "ad3", etablissementId: "et3", nom: "Girard", prenom: "Nadia", email: "nadia.girard@example.fr" },
  { id: "ad4", etablissementId: "et4", nom: "Perrin", prenom: "Julien", email: "julien.perrin@example.fr" },
];

export type NiveauLog = "info" | "avertissement" | "erreur";
export const NIVEAUX_LOG: NiveauLog[] = ["info", "avertissement", "erreur"];

export type NiveauPrivilege = "Administrateur Système" | "Administrateur Établissement" | "Utilisateur" | "Compte de service";

export type StatutEvenement = "Succès" | "Échec";

// Structure alignée sur les exigences de journalisation (horodatage UTC,
// acteur + privilège, réseau, description de l'action) — cf. retour client
// du 23/09. horodatageUTC est toujours au format ISO 8601 en UTC
// (suffixe "Z", produit par Date.toISOString()) : c'est le format de
// stockage qui permet de corréler des logs entre établissements/serveurs
// distincts ; l'affichage peut ensuite être localisé, mais la donnée reste
// en UTC en base.
export type LogEntry = {
  id: string;

  // Quand
  horodatageUTC: string;

  // Où (établissement métier concerné, absent = log plateforme)
  etablissementId?: string;

  // Qui
  utilisateurId: string;
  utilisateurNom: string;
  niveauPrivilege: NiveauPrivilege;

  // Réseau
  ipSource: string;
  ipDestination: string;
  portSource: number;
  portDestination: number;
  hostname: string;

  // Quoi & comment
  niveau: NiveauLog; // sévérité du log (info / avertissement / erreur)
  typeEvenement: string; // catégorie standardisée
  eventId: string; // identifiant d'événement standardisé (ex : EVT-AUTH-001)
  statut: StatutEvenement; // résultat de l'action
  cible: string; // ressource concernée par l'action
  source: string; // module applicatif à l'origine du log
  message: string; // description libre — jamais de donnée métier sensible
};

type ModeleLog = {
  niveau: NiveauLog;
  source: string;
  typeEvenement: string;
  eventId: string;
  statut: StatutEvenement;
  cible: string;
  message: string;
  niveauPrivilege: NiveauPrivilege;
  hostname: string;
  portDestination: number;
};

const MODELES_LOG: ModeleLog[] = [
  {
    niveau: "info",
    source: "Auth",
    typeEvenement: "Connexion",
    eventId: "EVT-AUTH-001",
    statut: "Succès",
    cible: "Session utilisateur",
    message: "Connexion réussie",
    niveauPrivilege: "Utilisateur",
    hostname: "app-planning-01.internal",
    portDestination: 443,
  },
  {
    niveau: "info",
    source: "Planning",
    typeEvenement: "Modification planning",
    eventId: "EVT-PLAN-010",
    statut: "Succès",
    cible: "Planning établissement",
    message: "Roulement appliqué sur une sélection de salariés",
    niveauPrivilege: "Administrateur Établissement",
    hostname: "app-planning-01.internal",
    portDestination: 443,
  },
  {
    niveau: "info",
    source: "Export",
    typeEvenement: "Export",
    eventId: "EVT-EXP-020",
    statut: "Succès",
    cible: "Export planning CDI",
    message: "Export planning CDI généré",
    niveauPrivilege: "Administrateur Établissement",
    hostname: "app-planning-01.internal",
    portDestination: 443,
  },
  {
    niveau: "avertissement",
    source: "Import RH",
    typeEvenement: "Import de données",
    eventId: "EVT-IMP-030",
    statut: "Succès",
    cible: "Import fiches salariés",
    message: "3 matricules ignorés (format invalide)",
    niveauPrivilege: "Compte de service",
    hostname: "batch-import-02.internal",
    portDestination: 5432,
  },
  {
    niveau: "avertissement",
    source: "Notifications",
    typeEvenement: "Notification",
    eventId: "EVT-NOTIF-040",
    statut: "Échec",
    cible: "Email de consultation",
    message: "Email de consultation non délivré (relance programmée)",
    niveauPrivilege: "Compte de service",
    hostname: "mail-relay-01.internal",
    portDestination: 587,
  },
  {
    niveau: "erreur",
    source: "Qualité",
    typeEvenement: "Génération de document",
    eventId: "EVT-QUAL-050",
    statut: "Échec",
    cible: "Document DUERP",
    message: "Échec de génération du document DUERP",
    niveauPrivilege: "Administrateur Établissement",
    hostname: "app-qualite-01.internal",
    portDestination: 443,
  },
  {
    niveau: "erreur",
    source: "Auth",
    typeEvenement: "Connexion",
    eventId: "EVT-AUTH-002",
    statut: "Échec",
    cible: "Session utilisateur",
    message: "Échec de connexion — mot de passe incorrect (5 tentatives)",
    niveauPrivilege: "Utilisateur",
    hostname: "app-planning-01.internal",
    portDestination: 443,
  },
  {
    niveau: "info",
    source: "Planning",
    typeEvenement: "Validation",
    eventId: "EVT-PLAN-011",
    statut: "Succès",
    cible: "Émargement mensuel",
    message: "Émargement mensuel validé",
    niveauPrivilege: "Administrateur Établissement",
    hostname: "app-planning-01.internal",
    portDestination: 443,
  },
];

const ACTEURS_UTILISATEUR_DEMO = [
  { id: "usr-201", nom: "Sophie Lambert" },
  { id: "usr-202", nom: "Marc Dubreuil" },
  { id: "usr-203", nom: "Julien Roy" },
];

const ACTEURS_SERVICE_DEMO = [
  { id: "svc-import-rh", nom: "Service Import RH" },
  { id: "svc-notifications", nom: "Service Notifications" },
];

function acteurPourModele(modele: ModeleLog, indexOccurrence: number, etablissement: Etablissement) {
  if (modele.niveauPrivilege === "Administrateur Établissement") {
    const admin = ADMINISTRATEURS_DEMO.find((a) => a.etablissementId === etablissement.id);
    return { id: admin?.id ?? "ad-inconnu", nom: admin ? `${admin.prenom} ${admin.nom}` : "Administrateur inconnu" };
  }
  if (modele.niveauPrivilege === "Compte de service") {
    const acteur = ACTEURS_SERVICE_DEMO[indexOccurrence % ACTEURS_SERVICE_DEMO.length];
    return acteur;
  }
  return ACTEURS_UTILISATEUR_DEMO[indexOccurrence % ACTEURS_UTILISATEUR_DEMO.length];
}

function ipSourceDemo(indexOccurrence: number, niveauPrivilege: NiveauPrivilege): string {
  if (niveauPrivilege === "Compte de service") return `10.0.2.${5 + (indexOccurrence % 3)}`;
  return `84.14.${20 + (indexOccurrence % 10)}.${100 + (indexOccurrence % 50)}`;
}

function genererLogsDemo(): LogEntry[] {
  const logs: LogEntry[] = [];
  const maintenant = new Date("2026-09-23T09:00:00Z");
  let id = 1;
  for (let i = 0; i < 42; i++) {
    const modele = MODELES_LOG[i % MODELES_LOG.length];
    const etablissement = ETABLISSEMENTS_DEMO[i % ETABLISSEMENTS_DEMO.length];
    const horodatage = new Date(maintenant.getTime() - i * 47 * 60 * 1000);
    const acteur = acteurPourModele(modele, Math.floor(i / MODELES_LOG.length), etablissement);
    logs.push({
      id: `log${id++}`,
      horodatageUTC: horodatage.toISOString(),
      etablissementId: etablissement.statut === "actif" ? etablissement.id : undefined,
      utilisateurId: acteur.id,
      utilisateurNom: acteur.nom,
      niveauPrivilege: modele.niveauPrivilege,
      ipSource: ipSourceDemo(i, modele.niveauPrivilege),
      ipDestination: "10.0.4.12",
      portSource: 49152 + (i % 16000),
      portDestination: modele.portDestination,
      hostname: modele.hostname,
      niveau: modele.niveau,
      typeEvenement: modele.typeEvenement,
      eventId: modele.eventId,
      statut: modele.statut,
      cible: modele.cible,
      source: modele.source,
      message: modele.message,
    });
  }
  return logs;
}

export const LOGS_DEMO: LogEntry[] = genererLogsDemo();

export function nomEtablissement(etablissements: Etablissement[], etablissementId?: string): string {
  if (!etablissementId) return "Plateforme";
  return etablissements.find((e) => e.id === etablissementId)?.nom ?? "Établissement inconnu";
}

export function logsRecents(logs: LogEntry[], nombre: number): LogEntry[] {
  return [...logs].sort((a, b) => b.horodatageUTC.localeCompare(a.horodatageUTC)).slice(0, nombre);
}

// Formate un horodatage UTC pour l'affichage — le fuseau reste explicitement
// UTC (le stockage l'est déjà) plutôt que de basculer silencieusement vers
// le fuseau du navigateur, pour que la corrélation entre logs reste fiable.
export function formatHorodatageUTC(iso: string): string {
  const date = new Date(iso);
  const formateur = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  });
  return `${formateur.format(date)} UTC`;
}

// Trafic (connexions/jour) sur les 7 derniers jours glissants — alimente le
// graphique en courbe du tableau de bord.
export type PointTrafic = { jour: string; dateISO: string; connexions: number };

export const TRAFIC_HEBDO_DEMO: PointTrafic[] = [
  { jour: "Jeu", dateISO: "2026-09-17", connexions: 132 },
  { jour: "Ven", dateISO: "2026-09-18", connexions: 149 },
  { jour: "Sam", dateISO: "2026-09-19", connexions: 79 },
  { jour: "Dim", dateISO: "2026-09-20", connexions: 66 },
  { jour: "Lun", dateISO: "2026-09-21", connexions: 178 },
  { jour: "Mar", dateISO: "2026-09-22", connexions: 187 },
  { jour: "Mer", dateISO: "2026-09-23", connexions: 135 },
];

// Volume de données par établissement — alimente le graphique en barres du
// tableau de bord.
export type VolumeEtablissement = { etablissementId: string; volumeMo: number };

export const VOLUME_PAR_ETABLISSEMENT_DEMO: VolumeEtablissement[] = [
  { etablissementId: "et1", volumeMo: 640 },
  { etablissementId: "et2", volumeMo: 820 },
  { etablissementId: "et3", volumeMo: 340 },
  { etablissementId: "et4", volumeMo: 40 },
];

// KPIs globaux du tableau de bord (calculés à partir des données de démo —
// dans la vraie application, agrégés en base tous établissements confondus).
export function calculerKpis(etablissements: Etablissement[], logs: LogEntry[]) {
  const actifs = etablissements.filter((e) => e.statut === "actif");
  return {
    nbEtablissements: etablissements.length,
    nbEtablissementsActifs: actifs.length,
    nbUtilisateurs: 47, // proxy démo : total comptes Administrateur + Utilisateur tous établissements
    nbSalaries: 312, // proxy démo : total fiches salariés tous établissements
    volumeDonneesMo: VOLUME_PAR_ETABLISSEMENT_DEMO.reduce((somme, v) => somme + v.volumeMo, 0),
    traficConnexions7j: TRAFIC_HEBDO_DEMO.reduce((somme, p) => somme + p.connexions, 0),
    nbErreurs24h: logs.filter(
      (l) => l.niveau === "erreur" && Date.now() - new Date(l.horodatageUTC).getTime() < 24 * 3600 * 1000
    ).length,
  };
}
