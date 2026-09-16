# Synthèse fonctionnelle — Application de planning EHPAD

Ce document reprend, sous une forme proche d'un cahier des charges,
l'ensemble des éléments fonctionnels de l'application décidés à ce jour :
d'une part ceux déjà présents dans la maquette graphique (Partie 1), d'autre
part les décisions structurantes prises en préparation du backend (Partie 2).
Il décrit **ce que l'application permet ou permettra de faire**, sans détail
d'implémentation, et est mis à jour au fil des échanges.

## Périmètre actuel

L'application est à ce stade une **maquette interactive** : elle permet de
valider les écrans et les comportements attendus, mais fonctionne avec des
données de démonstration fictives, sans compte utilisateur réel ni
sauvegarde durable des modifications (les données de démonstration sont
réinitialisées à chaque nouvelle visite).

---

## Partie 1 — Écrans et parcours (maquette graphique)

### 1. Vue Planning (écran principal)

Grille principale de gestion du planning des salariés.

- **Organisation** : une ligne par salarié, une colonne par jour. Les
  salariés sont regroupés par service, puis triés par ordre alphabétique.
- **Période affichée** : 4 semaines visibles à la fois, avec navigation vers
  la période précédente/suivante, ou sélection directe d'une date de départ.
  La dernière période consultée est mémorisée d'une visite à l'autre.
- **Repères visuels** : les week-ends et jours fériés sont grisés dans les
  en-têtes de colonnes.
- **Filtre d'affichage des salariés** : un sélecteur en haut de l'écran
  permet de n'afficher que certains salariés :
  - *Tous*
  - *Présents* (contrat actif et indiqué comme présent)
  - *Non présents* (contrat actif mais indiqué comme absent)
  - *Contrat actif* / *Contrat inactif*
  - *Avec planning* / *Sans planning* — ces deux derniers filtres sont
    recalculés automatiquement selon la période affichée : un salarié peut
    apparaître ou disparaître selon la période consultée.

#### Saisie d'un code horaire

- Un clic sur une case ouvre un sélecteur de code horaire (recherche par
  code ou par intitulé), avec aperçu de la couleur du code.
- Deux familles de codes horaires peuvent être posées sur une case :
  - **Code de travail** : détermine les heures effectivement travaillées à
    partir des plages horaires définies pour ce code (ex. 07:00–13:00 /
    14:00–19:00).
  - **Code événementiel** : vient qualifier ou modifier un jour. Deux
    comportements possibles, définis par l'administrateur sur chaque code :
    - **Superposition** (ex. Maladie, Carence maladie, Absence injustifiée) :
      se superpose au code de travail du jour et **remplace entièrement**
      le décompte d'heures de la journée (règle définie sur le code : 0
      heure, heures du code de travail initial, ou nombre d'heures
      personnalisé). Le code de travail reste affiché mais barré, et le
      nombre d'heures résultant est indiqué à côté.
    - **Complément à la volée** (ex. Absence temporaire, Heures
      supplémentaires) : au moment de poser le code, l'utilisateur saisit
      une plage horaire libre. La partie de cette plage qui chevauche le
      code de travail est déduite des heures du jour, la partie en dehors
      est ajoutée. L'écart (+ ou − nombre d'heures) est affiché
      explicitement. Pour éviter toute ambiguïté, la plage saisie doit être
      **entièrement incluse** dans une plage du code de travail, ou
      **entièrement en dehors** : un chevauchement partiel est refusé.
  - Certains codes (ex. Congés, Congé sans solde) s'utilisent seuls et
    remplacent la case entière plutôt que de se superposer.
- Une case peut être vidée à tout moment ; elle redevient alors disponible
  pour une nouvelle planification.

#### Roulements (motifs récurrents)

- Un salarié peut se voir assigner un **roulement** : un motif d'horaires se
  répétant sur une ou plusieurs semaines complètes.
- Sur une case jamais planifiée, si le salarié a un roulement en cours, un
  raccourci permet de l'appliquer directement, de la semaine cliquée jusqu'à
  la fin de la période affichée.
- Il est également possible de sélectionner plusieurs salariés à la fois
  (sur un même jour) pour appliquer en une seule action le roulement en
  cours de chacun ; un récapitulatif indique qui sera planifié, qui est déjà
  planifié (donc ignoré) et qui n'a pas de roulement assigné.
- Un roulement ne vient jamais écraser une case déjà remplie : si au moins
  une semaine de la période concernée contient déjà un code, l'application
  du roulement est bloquée pour ce salarié et la semaine en cause est
  signalée, plutôt que d'appliquer partiellement le roulement.

#### Effacement de plages

- Il est possible de sélectionner un ensemble de cases déjà remplies (une ou
  plusieurs lignes, un ou plusieurs jours) et de les effacer en une seule
  action, après confirmation. Les cases effacées redeviennent disponibles
  pour une nouvelle planification.

#### Accès à la fiche d'un salarié

- Cliquer sur le nom d'un salarié ouvre sa vue « Émargement » pour le mois
  actuellement affiché.

---

### 2. Émargement — vue mensuelle

Vue calendaire mensuelle du planning d'un salarié, destinée à sa validation.

- Présentation en calendrier classique (semaines en ligne, jours en
  colonne).
- Pour chaque jour : le code de travail (avec son intitulé et ses plages
  horaires) est affiché au-dessus du code événementiel du jour, chacun dans
  sa propre couleur.
  - Si le jour porte un code événementiel de type superposition, le
    décompte d'heures initial du code de travail est barré et le nombre
    d'heures réellement retenu (selon la règle du code événementiel)
    apparaît à côté.
  - Si le jour porte un code événementiel de type complément à la volée, la
    plage horaire saisie et l'écart (+/− heures) sont affichés directement
    sur ce code.
- Un total d'heures est affiché pour chaque semaine (aligné à droite de la
  ligne) et pour le mois entier (en bas de la vue).
- Un bouton permet de **valider le mois**, ce qui indique que le salarié
  confirme que le planning correspond aux heures réellement effectuées ; une
  fois validé, le mois est marqué comme non modifiable.
- Des emplacements de signature (salarié et responsable) sont prévus pour un
  usage papier, avec un bouton d'impression qui adapte l'affichage au
  format imprimé.

### 3. Émargement — vue annuelle

Vue de repérage rapide des évènements particuliers sur une année complète
pour un salarié, accessible depuis un sélecteur « Mensuel / Annuel » en haut
de la vue Émargement (même salarié, mêmes couleurs, même bouton
d'impression).

- Grille à 12 colonnes (une par mois) et jusqu'à 31 lignes (un jour du mois
  par ligne), permettant de visualiser l'année entière sur un seul écran.
- Chaque jour n'affiche qu'une couleur et un code court, sans détail
  d'horaire ; le survol d'une case affiche la date et l'intitulé complet.
- Seuls les codes horaires explicitement configurés pour apparaître dans
  cette vue (typiquement les absences) colorent leur jour ; les autres jours
  restent neutres. Si un jour porte à la fois un code de travail et un code
  événementiel tous deux configurés pour cette vue, le code événementiel est
  prioritaire.
- Une légende sous la grille rappelle la correspondance entre chaque couleur
  et son intitulé.
- Cette vue est purement informative : elle ne comporte pas de validation ni
  de signature, contrairement à la vue mensuelle.
- Navigation d'une année à l'autre (précédente/suivante).

---

### 4. Administration

Écrans réservés au profil Administrateur, regroupés dans un menu dédié.

#### Codes horaires

- Liste des codes horaires existants, avec création, modification et
  suppression.
- Pour chaque code : un code court, un intitulé, une couleur de fond et de
  texte, une catégorie (Travail, Informatif, Particulier, Événementiel).
- Pour un code de catégorie Travail : jusqu'à 4 plages horaires, avec calcul
  automatique du total d'heures.
- Pour un code de catégorie Événementiel : choix du comportement
  (superposition ou complément à la volée) et, pour la superposition, choix
  de la règle de décompte d'heures (0 heure / heures du code initial /
  nombre d'heures personnalisé).
- Une case à cocher détermine si le code doit apparaître dans la vue
  annuelle d'un salarié.
- Un champ commentaire libre est disponible sur chaque code.

#### Roulements

- Liste des roulements existants, avec création et modification.
- Un roulement est défini par un nom et un nombre de semaines ; pour chaque
  semaine, la répartition des codes horaires est saisie jour par jour (du
  lundi au dimanche) à l'aide du même sélecteur de code que la vue Planning.

#### Salariés

- Liste des salariés, avec création et modification de leur fiche.
- Une fiche salarié comporte : matricule, nom, prénom, service, type de
  contrat (CDD/CDI) et son caractère actif ou non, responsable hiérarchique
  optionnel, statut de présence, et éventuellement un compte utilisateur
  associé.
- Le roulement en cours du salarié est affiché de façon compacte sur sa
  fiche, avec accès à un panneau dédié permettant de consulter l'historique
  des roulements assignés et d'en assigner un nouveau (avec une date de
  début et, éventuellement, une date de fin).

#### Utilisateurs

- Liste des utilisateurs de l'application, avec création et modification.
- Une fiche utilisateur comporte : identifiant, nom, prénom, email, type
  d'utilisateur (Administrateur / Utilisateur), service, poste.

#### Années et jours fériés

- Création d'une nouvelle année planifiée : jours fériés fixes et jours
  fériés calculés (ex. lundi de Pâques), jours fériés personnalisés
  additionnels, gestion automatique des années bissextiles.
- Une année déjà planifiée ne peut pas être supprimée.

#### Identité de l'établissement

- Configuration du nom affiché et du logo de l'établissement, visibles dans
  l'ensemble de l'application.
- Première étape vers la prise en charge de plusieurs établissements
  indépendants au sein d'une même application (chacun avec ses propres
  utilisateurs et données) — seule cette brique d'identité visuelle est
  disponible à ce stade.

---

### 5. Profil utilisateur

Un menu accessible en haut à droite des écrans principaux permet à
l'utilisateur connecté de consulter son profil (type d'utilisateur, nom,
prénom, service, poste). Cette consultation est pour l'instant en lecture
seule.

---

## Partie 2 — Fondations architecturales

Cette partie documente les décisions structurantes prises en préparation du
backend, au fur et à mesure qu'elles sont tranchées. Elle est appelée à
s'enrichir (API, architecture multi-application, environnements) au fil des
prochains échanges.

### 1. Authentification et gestion des comptes

#### Types de comptes

- **Administrateur Système** : supervision globale de l'application, tous
  établissements confondus. Porteur des futures fonctions d'administration
  technique, notamment la visualisation des logs (écrans à concevoir dans un
  epic ultérieur).
- **Administrateur** : compte métier, par établissement (le directeur ou son
  adjoint) — accès automatique à toutes les applications de son
  établissement (Planning, et une future application Qualité).
- **Utilisateur** : l'accès à chaque application est indépendant — un compte
  peut être rattaché à aucune, une seule, ou plusieurs applications.
- Le salarié ne dispose pas de compte utilisateur.

#### Réinitialisation de mot de passe

- Flux principal : l'administrateur fixe directement un nouveau mot de passe
  pour un utilisateur, sans envoi d'email.
- Flux complémentaire, en libre-service : un lien de réinitialisation envoyé
  par email (« mot de passe oublié »), pour un déploiement de taille réduite
  dans un premier temps — ce flux reste un confort secondaire, non
  bloquant : le flux administrateur ci-dessus reste toujours disponible en
  repli.

#### Session

- Plusieurs sessions simultanées sont autorisées pour un même compte (pas de
  restriction à une seule connexion active).
- Une session est fermée automatiquement après **15 minutes d'inactivité**,
  quel que soit le type de compte.

#### Règles de mot de passe

- Longueur minimale de **8 caractères**.
- Au moins **un caractère spécial**.
- Un indicateur de robustesse (jauge de complexité) doit passer au vert
  avant de pouvoir valider le mot de passe, afin d'écarter les mots de
  passe qui respectent les règles ci-dessus tout en restant trivialement
  faibles (ex. « 12345678! »).

### 2. Modélisation de la base de données

Modèle conceptuel (MCD) et logique (MLD) couvrant l'ensemble des exigences
de la maquette et les décisions ci-dessus, organisé en 7 domaines. Document
de détail : [modèle de données](https://claude.ai/artifact/3sR99FsK3pjzNivG7NB8FV)
(issue #25).

- **Établissement, comptes & applications** : un établissement (EHPAD)
  porte ses services et ses comptes. L'Administrateur Système est modélisé
  dans une table séparée des comptes d'établissement, puisqu'il n'est
  rattaché à aucun EHPAD ni à aucune application — il supervise l'ensemble.
  Chaque établissement souscrit explicitement aux applications auxquelles il
  a accès (ex. un établissement qui n'a pas pris l'application Qualité) ;
  l'accès individuel d'un compte Utilisateur à une application reste
  toujours contenu dans les applications souscrites par son établissement.
- **Salariés & organisation** : le salarié reste une entité totalement
  indépendante du compte utilisateur, conformément à la décision « le
  salarié n'a pas de compte ». Son contrat de travail est historisé : un
  salarié peut avoir eu plusieurs contrats successifs (CDD renouvelés,
  passage en CDI…), un seul étant actif à un instant donné.
- **Codes horaires** : un code horaire porte les champs communs à toute
  catégorie (Travail / Informatif / Particulier / Événementiel), ainsi que
  les champs propres à la catégorie Événementiel (comportement, règle de
  décompte).
- **Roulements** : un motif récurrent (nombre de semaines × 7 jours), et son
  affectation dans le temps à un salarié, avec historique des affectations
  successives.
- **Planning & émargement** : une case par salarié et par jour, portant un
  code de travail et/ou un code événementiel ; un enregistrement dédié
  matérialise la validation mensuelle d'un salarié.
- **Calendrier** : une année planifiée par établissement, avec ses jours
  fériés fixes, calculés et personnalisés.
- **Traçabilité** : un historique dédié aux valeurs successives d'une case
  de planning (répond au point ouvert « traçabilité des cellules »), complété
  par un journal d'audit générique pour les autres opérations (roulements,
  codes horaires, comptes…). L'auteur d'une opération peut être un compte
  d'établissement ou l'Administrateur Système : les deux entités partagent
  la même identité technique sous-jacente.

Certaines règles de cohérence ne peuvent pas être exprimées par une simple
contrainte sur une table (ex. « au plus un contrat actif par salarié », ou
« un code posé comme code de travail doit bien être de catégorie Travail »).
Elles seront garanties directement en base de données (index et contraintes
dédiés), et non uniquement côté applicatif : l'API générée par Supabase
étant directement accessible, seules les règles posées en base constituent
une garantie fiable.

---

## Annexes

### Fonctionnalités envisagées mais non encore traitées

Ces besoins ont été identifiés mais nécessitent d'être précisés avant
développement :

- **Menu d'export** depuis la vue Planning (contenu, formats et périmètre
  des données exportées à définir).
- **Verrouillage visuel des jours passés** dans la grille Planning.
- **Adaptation de la grille Planning aux écrans mobiles.**
- **Plusieurs établissements indépendants** : au-delà de l'écran d'identité
  (nom/logo), la séparation complète des données et des utilisateurs entre
  établissements distincts reste à mettre en œuvre.
- **Export PDF téléchargeable** de la vue Émargement (au-delà de
  l'impression navigateur déjà disponible).

### Questions fonctionnelles restant à trancher

- Les droits exacts d'un compte Utilisateur (au-delà des trois types de
  compte désormais fixés : Administrateur Système / Administrateur /
  Utilisateur) restent à détailler écran par écran.
- Dans une optique multi-établissements, qui est habilité à créer un
  nouvel établissement dans l'application ?
