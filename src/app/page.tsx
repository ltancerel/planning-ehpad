import PlanningGrid from "@/components/PlanningGrid";
import { type Salarie, type ProfilUtilisateur } from "@/lib/mock-data";
import { HORAIRE_CODES } from "@/lib/horaire-codes";

// Maquette multi-application (EPIC #46, story #47, urgent) — branche
// exploratoire, jamais fusionnée. Réutilise le vrai composant PlanningGrid
// (même rendu que Staging/Prod) mais avec des données fictives en dur,
// aucun appel Supabase : pas de dépendance base de données ni
// d'authentification pour cette maquette (même logique que l'EPIC
// « Maquette graphique v0 » à l'origine du vrai Planning). Le chargement
// interne du planning réel (chargerPlanningReel, appelé par PlanningGrid
// côté client) échouera silencieusement faute de backend — la grille reste
// vide/hachurée, ce qui n'empêche pas de voir et manipuler l'interface
// réelle (filtres, sélecteur de code, navigation, en-tête).

const SALARIES_DEMO: Salarie[] = [
  { id: "1", nom: "BERNARD", prenom: "Claire", service: "IDE", groupeRoulement: "Équipe A", presence: "Présent", typePaie: "Aucun" },
  { id: "2", nom: "LAURENT", prenom: "Inès", service: "ASH", groupeRoulement: "Équipe B", presence: "Présent", typePaie: "25/M" },
  { id: "3", nom: "MARTIN", prenom: "Paul", service: "ASH", groupeRoulement: "Équipe B", presence: "Présent", typePaie: "Aucun" },
  { id: "4", nom: "DUBOIS", prenom: "Julie", service: "IDE", groupeRoulement: "Équipe A", presence: "Présent", typePaie: "30/M" },
  { id: "5", nom: "PETIT", prenom: "Marc", service: "Administratif", groupeRoulement: null, presence: "Présent", typePaie: "Aucun" },
  { id: "6", nom: "ROUX", prenom: "Sophie", service: "ASH", groupeRoulement: "Équipe C", presence: "Présent", typePaie: "25/M" },
  { id: "7", nom: "MOREAU", prenom: "Thomas", service: "IDE", groupeRoulement: "Équipe C", presence: "Absent", typePaie: "Aucun" },
  { id: "8", nom: "SIMON", prenom: "Camille", service: "ASH", groupeRoulement: "Équipe D", presence: "Présent", typePaie: "Aucun" },
];

const UTILISATEUR_DEMO: ProfilUtilisateur = {
  nom: "DUPONT",
  prenom: "Julie",
  typeUtilisateur: "Administrateur",
  service: "Administratif",
  mesServices: [],
  poste: "Directrice",
};

export default function Home() {
  return (
    <PlanningGrid
      salaries={SALARIES_DEMO}
      servicesOrdre={["IDE", "ASH", "Administratif"]}
      managers={[]}
      codesHoraires={HORAIRE_CODES}
      joursFeries={[]}
      roulements={[]}
      affectationsRoulement={{}}
      ehpad={{ nom: "EHPAD Démo", logo: null }}
      utilisateur={UTILISATEUR_DEMO}
    />
  );
}
