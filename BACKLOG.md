# Backlog

Suivi détaillé (source de vérité) — chaque Story a aussi une issue GitHub liée pour le suivi visuel.

## Extension au cahier des charges — Multi-EHPAD (ajout du 15/09/2026)

Non prévu dans le CDC initial, ajouté à la demande du client : l'application doit
pouvoir servir **plusieurs EHPAD indépendants** (le logiciel est déjà prévu en SaaS),
avec **segmentation complète des données et des utilisateurs** entre EHPAD (un
utilisateur d'un EHPAD ne doit jamais voir les données d'un autre EHPAD).

**Approche technique retenue** : base Supabase unique et partagée, avec une colonne
`ehpad_id` sur chaque table métier (utilisateurs, salariés, planning, codes horaires,
roulements, années...) et des policies Row Level Security scopant chaque requête à
l'EHPAD de l'utilisateur connecté. Choisi plutôt qu'une base par EHPAD, pour rester
cohérent avec l'objectif de minimisation des coûts.

**Impact sur le modèle de données** : ajout d'une entité EHPAD (nom/titre, logo) en
tête de la hiérarchie ; toutes les entités existantes (Utilisateur, Salarié, Horaire,
Roulement, Année, Journée) devront être rattachées à un EHPAD.

## EPIC — Maquette graphique (v0)

**Objectif** : livrer une maquette interactive des écrans principaux, avec des données
fictives, sans authentification ni persistance réelle. Sert de support de validation
visuelle avant d'attaquer le modèle de données et le backend (Supabase).

**Hors périmètre de l'Epic** : auth, base de données réelle, calculs métier fiabilisés,
export réel, connecteur paie.

### Stories

- [x] **1. Vue Planning — grille principale**
  Grille salariés × jours, groupée par service puis ordre alphabétique, 4 semaines
  visibles, en-têtes jour/date grisés le week-end et jours fériés, saisie de code
  horaire en cellule.
  _Statut : fait, déployé sur Vercel (tag `DEMO-V0`)._

- [x] **2. Sélecteur de période dédié**
  Bouton dédié pour changer la période affichée (au lieu des flèches actuelles) +
  mémorisation de la période d'une ouverture à l'autre (stub `localStorage` pour la
  maquette).
  _Statut : fait, déployé sur `main`._

- [x] **3. Superposition d'un code événementiel sur un code travail**
  Une cellule peut porter un code travail (ligne 1) et, superposé, un code
  événementiel (ligne 2) qui vient l'amender — cf. CDC section 3/ « des codes
  horaire évènementiels qui viennent... se superposer sur des codes horaires de
  travail ». Seuls les codes événementiels dotés d'une règle d'heures s'y prêtent
  (CAR/ABI/MAL, superposent) ; les autres (ABA/CP) s'utilisent seuls et remplacent
  la cellule entière. Les heures réellement comptabilisées suivent la règle du code
  événementiel (0h, heures du code initial, ou personnalisé).
  _Statut : fait, déployé sur `main`._
  _Révision du 15/09 : la version initiale de cette story portait sur les codes
  informatifs (« à demander »...), erreur d'interprétation du CDC corrigée par le
  client — ce cas est abandonné, pas de story de remplacement prévue pour l'instant._

- [x] **4. Sélecteur de code horaire**
  Remplacer la saisie texte libre actuelle par un sélecteur (liste déroulante /
  recherche typeahead) avec aperçu couleur, plus proche de l'outil existant montré
  dans le CDC.
  _Statut : fait, déployé sur `main`._

- [x] **5. Vue Émargement**
  Maquette de la vue mensuelle de validation du planning par le salarié : grille
  calendrier (semaines en ligne, jours en colonne comme un calendrier classique —
  revu suite au retour client), heures réalisées extrapolées des codes horaires
  (réutilise la logique de superposition événementielle de la story #3), bouton de
  validation, case signature salarié + manager et bouton Imprimer pour un format
  papier (styles `print:` dédiés masquant les éléments non pertinents sur papier).
  Accessible en cliquant sur le nom d'un salarié dans la grille planning.
  _Statut : fait, déployé sur `main`._

- [x] **6. Config — Ajouter un utilisateur**
  Formulaire maquette (type d'utilisateur, nom, prénom, service, poste).
  _Statut : fait, déployé sur `main`. Liste + formulaire (identifiant 3 lettres,
  email, type, service, poste), écran réservé à l'administrateur._

- [x] **7. Config — Ajouter un salarié**
  Formulaire maquette complet : matricule, nom, prénom, service, type de contrat,
  manager optionnel, roulement, présence.
  _Statut : fait, déployé sur `main`. Liste + formulaire (matricule 4 lettres,
  contrat CDD/CDI + actif/inactif, manager, présence, compte utilisateur optionnel).
  Champ Roulement présent mais désactivé (dépend de la story #9)._

- [x] **8. Config — Créer un code horaire (Admin)**
  Maquette de l'écran de création d'un code horaire : code, couleur police/fond,
  intitulé, jusqu'à 4 plages, commentaire (cf. capture CDC image1).
  Écran réservé à l'administrateur (pas d'accès utilisateur standard).
  _Statut : fait, déployé sur `main`. À revoir si besoin après retour client._

- [x] **9. Config — Créer un roulement**
  Maquette de l'écran de création d'un roulement (nombre de semaines, répartition
  des horaires dans les semaines). Chaque semaine du motif est un bloc complet
  Lundi→Dimanche (roulement aligné sur la semaine).
  _Statut : fait, déployé sur `main`. Liste + formulaire (nom, nombre de semaines
  réglable, grille de répartition réutilisant le vrai sélecteur de code horaire
  sans les codes événementiels)._

- [x] **9bis. Assigner un roulement à un salarié**
  Distincte de la story 9 (décision du 16/09) : le roulement est assigné à un
  salarié, avec une date de début (alignée sur le lundi de sa semaine) et une
  date de fin optionnelle. Vient compléter le champ Roulement désactivé de la
  story « Ajouter un salarié ». Par défaut, un salarié n'a aucun roulement.
  _Statut : fait, non encore mergé sur `main`. Fiche salarié (Admin > Salariés
  > Modifier) : ligne compacte affichant le roulement en cours + bouton
  « Gérer » ouvrant un panneau dédié (roulement en cours, historique des
  affectations, formulaire d'assignation avec date de début ramenée au lundi
  et date de fin optionnelle) — pour ne pas alourdir la fiche elle-même (retour
  client du 15/09). Pas de projection automatique dans la grille Planning à ce
  stade — la fiche salarié (`FicheSalarie`) et l'entité utilisée par la grille
  (`Salarie`) restent deux modèles distincts dans cette maquette (cf. point
  ouvert dédié)._
  _Révision du 15/09 : la première version mettait l'assignation dans la vue
  Planning (icône par ligne) et proposait un « roulement par défaut » assigné
  automatiquement à la création — retour client : le roulement est un
  attribut du salarié (donc géré dans sa fiche) et un salarié créé n'a par
  défaut aucun roulement._

- [x] **10. Config — Planifier une année**
  Maquette de l'écran de création d'année (jours fériés fixes/configurables, gestion
  année bissextile).
  _Statut : fait, déployé sur `main`. Jours fériés fixes + calculés depuis Pâques
  (algorithme de Meeus/Jones/Butcher) pour l'année choisie, jours personnalisés,
  détection bissextile. Formulaire par défaut sur 2027 pour simuler l'année
  suivante. Suppression d'une année désactivée dans l'UI (retour client du 16/09 :
  une année déjà planifiée ne doit pas pouvoir être supprimée — voir aussi le point
  ouvert "à appliquer côté backend" ci-dessous)._

- [ ] **12. Blocage visuel du planning passé**
  Affichage grisé/verrouillé des cellules passées dans la grille (visuel uniquement,
  sans logique de verrouillage réelle à ce stade).

- [ ] **13. Adaptation mobile de la grille**
  Version condensée/scrollable de la grille planning pour écran mobile (le CDC exige
  un affichage web *et* mobile).

- [x] **14. Consulter son profil**
  Menu utilisateur en haut à droite (nom/avatar) sur les écrans principaux, ouvrant
  un panneau de consultation du profil : type d'utilisateur, nom, prénom, service,
  poste. Lecture seule pour cette maquette (pas d'édition — à confirmer selon la
  clarification à venir sur les droits de l'utilisateur standard).
  _Statut : fait, déployé sur `main`._

- [x] **15. Config — Identité de l'EHPAD (titre + logo)**
  Écran de configuration de l'EHPAD courant : titre affiché en haut à gauche
  (remplace le libellé générique « Planning ») + upload/aperçu d'un logo. Première
  brique visuelle de la segmentation multi-EHPAD (voir section dédiée ci-dessus).
  Écran réservé à l'administrateur.
  _Statut : fait, déployé sur `main`. Logo par défaut "Les Jardins de Rambam"
  (recréé en SVG), menu admin multi-sections ajouté au passage._

## Sortie de l'Epic — à préciser avant de reprendre

- **Menu Export** (retiré de l'EPIC le 15/09, issue #12 détachée) : la maquette du
  menu d'export accessible depuis la vue Planning avait une spécification trop
  imprécise pour être développée en l'état (contenu du menu ? formats ? périmètre
  des données exportées ?). À clarifier avec le client avant de la réintégrer dans
  un prochain Epic.

## Idées pour epics futurs (hors périmètre maquette graphique v0)

- **Export PDF téléchargeable** (ajouté le 15/09, suite à la case signature de la
  vue émargement) : au-delà de l'impression navigateur déjà en place
  (`window.print()`, qui permet déjà d'enregistrer en PDF via le navigateur), un
  vrai bouton « Télécharger le PDF » nécessiterait une génération côté serveur
  (ex: Puppeteer/Playwright headless, ou une lib type `react-pdf`) puisque
  l'application n'a pas encore de backend. À prévoir dans l'Epic backend, probablement
  en même temps que la story Menu Export (#12, sortie de l'Epic v0 en attente de
  clarification — voir section dédiée ci-dessus).

## Points ouverts (hors périmètre maquette graphique, à trancher avant le backend)

- Nombre de types d'utilisateur (2 vs 3) et droits exacts de l'utilisateur standard
- Salariés = utilisateurs de l'app ou simples lignes de planning ?
- Login mono-session : pertinent ?
- Notion de contrat à préciser
- Complexité du mot de passe à définir
- Multi-EHPAD : qui peut créer un nouvel EHPAD ? Un rôle super-admin distinct de
  l'Administrateur actuel (qui serait alors scopé à son EHPAD), ou création manuelle
  hors application pour l'instant ?
- **Deux représentations distinctes du salarié dans la maquette** (relevé le
  16/09 en construisant la story 9bis) : la vue Planning utilise une entité
  `Salarie` (simple, sert de support à la démo de plein de salariés) tandis que
  l'écran Admin « Ajouter un salarié » utilise une entité `FicheSalarie` plus
  complète, non reliée par identifiant à la première. L'affectation de
  roulement (historique, roulement en cours) vit donc côté `FicheSalarie`
  (fiche salarié) sans se répercuter sur la grille Planning pour l'instant. À
  unifier en un seul modèle Salarié lors du passage au vrai backend — c'est ce
  modèle unifié qui permettra de vraiment projeter le roulement assigné dans
  la grille planning.
- **Intégrité des données à valider côté backend, pas seulement côté front**
  (retour client du 16/09, suite à la suppression d'une année dans la maquette) :
  toute règle du type "on ne peut pas supprimer X" doit être appliquée côté serveur
  (contrainte DB / policy Supabase / vérification API), le front ne pouvant être
  qu'un confort UX — contournable via appel direct à l'API, DevTools, etc. À
  reprendre explicitement dans les specs backend pour chaque règle de suppression
  déjà mockée côté front (années, et sans doute plus tard salariés/utilisateurs
  avec historique).
