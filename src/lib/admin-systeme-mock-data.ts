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

export type LogEntry = {
  id: string;
  dateHeureISO: string; // ISO complet (date + heure)
  etablissementId?: string; // absent = log plateforme (hors établissement)
  niveau: NiveauLog;
  source: string;
  message: string;
};

function genererLogsDemo(): LogEntry[] {
  const modeles: { niveau: NiveauLog; source: string; message: string }[] = [
    { niveau: "info", source: "Auth", message: "Connexion réussie" },
    { niveau: "info", source: "Planning", message: "Roulement appliqué sur une sélection de salariés" },
    { niveau: "info", source: "Export", message: "Export planning CDI généré" },
    { niveau: "avertissement", source: "Import RH", message: "3 matricules ignorés (format invalide)" },
    { niveau: "avertissement", source: "Notifications", message: "Email de consultation non délivré (relance programmée)" },
    { niveau: "erreur", source: "Qualité", message: "Échec de génération du document DUERP" },
    { niveau: "erreur", source: "Auth", message: "Échec de connexion — mot de passe incorrect (5 tentatives)" },
    { niveau: "info", source: "Planning", message: "Émargement mensuel validé" },
  ];

  const logs: LogEntry[] = [];
  const maintenant = new Date("2026-09-23T09:00:00");
  let id = 1;
  for (let i = 0; i < 42; i++) {
    const modele = modeles[i % modeles.length];
    const etablissement = ETABLISSEMENTS_DEMO[i % ETABLISSEMENTS_DEMO.length];
    const horodatage = new Date(maintenant.getTime() - i * 47 * 60 * 1000);
    logs.push({
      id: `log${id++}`,
      dateHeureISO: horodatage.toISOString(),
      etablissementId: etablissement.statut === "actif" ? etablissement.id : undefined,
      niveau: modele.niveau,
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
  return [...logs].sort((a, b) => b.dateHeureISO.localeCompare(a.dateHeureISO)).slice(0, nombre);
}

// KPIs globaux du tableau de bord (calculés à partir des données de démo —
// dans la vraie application, agrégés en base tous établissements confondus).
export function calculerKpis(etablissements: Etablissement[], logs: LogEntry[]) {
  const actifs = etablissements.filter((e) => e.statut === "actif");
  return {
    nbEtablissements: etablissements.length,
    nbEtablissementsActifs: actifs.length,
    nbUtilisateurs: 47, // proxy démo : total comptes Administrateur + Utilisateur tous établissements
    nbSalaries: 312, // proxy démo : total fiches salariés tous établissements
    volumeDonneesMo: 1840, // proxy démo : volume de données stocké
    traficConnexions7j: 926, // proxy démo : nombre de connexions sur 7 jours glissants
    nbErreurs24h: logs.filter(
      (l) => l.niveau === "erreur" && Date.now() - new Date(l.dateHeureISO).getTime() < 24 * 3600 * 1000
    ).length,
  };
}
