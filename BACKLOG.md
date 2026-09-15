# Backlog

Suivi détaillé (source de vérité) — chaque Story a aussi une issue GitHub liée pour le suivi visuel.

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

- [ ] **3. Affichage 2 lignes en cellule**
  Pour les codes informatifs qui l'exigent (« à demander », « en attente de réponse »,
  « soutien »), afficher le code horaire de travail en ligne 1 et le code informatif
  en ligne 2 dans la même cellule.

- [ ] **4. Sélecteur de code horaire**
  Remplacer la saisie texte libre actuelle par un sélecteur (liste déroulante /
  recherche typeahead) avec aperçu couleur, plus proche de l'outil existant montré
  dans le CDC.

- [ ] **5. Vue Émargement**
  Maquette de la vue mensuelle de validation du planning par le salarié, sur le
  modèle des captures fournies dans le CDC.

- [ ] **6. Config — Ajouter un utilisateur**
  Formulaire maquette (type d'utilisateur, nom, prénom, service, poste).

- [ ] **7. Config — Ajouter un salarié**
  Formulaire maquette complet : matricule, nom, prénom, service, type de contrat,
  manager optionnel, roulement, présence.

- [x] **8. Config — Créer un code horaire (Admin)**
  Maquette de l'écran de création d'un code horaire : code, couleur police/fond,
  intitulé, jusqu'à 4 plages, commentaire (cf. capture CDC image1).
  Écran réservé à l'administrateur (pas d'accès utilisateur standard).
  _Statut : fait, déployé sur `main`. À revoir si besoin après retour client._

- [ ] **9. Config — Créer un roulement**
  Maquette de l'écran de création d'un roulement (nombre de semaines, répartition
  des horaires dans les semaines).

- [ ] **10. Config — Planifier une année**
  Maquette de l'écran de création d'année (jours fériés fixes/configurables, gestion
  année bissextile).

- [ ] **11. Menu Export**
  Maquette du menu d'export accessible depuis la vue Planning.

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

## Points ouverts (hors périmètre maquette graphique, à trancher avant le backend)

- Nombre de types d'utilisateur (2 vs 3) et droits exacts de l'utilisateur standard
- Salariés = utilisateurs de l'app ou simples lignes de planning ?
- Login mono-session : pertinent ?
- Notion de contrat à préciser
- Complexité du mot de passe à définir
