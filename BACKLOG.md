# Backlog

Suivi détaillé (source de vérité) — chaque Story a aussi une issue GitHub liée pour le suivi visuel.

## Convention — Tests (ajoutée le 25/09/2026)

Chaque changement fonctionnel s'accompagne désormais des tests
correspondants, dans le même commit — cf. `AGENTS.md` § Tests pour le
détail. Deux suites, indépendantes :

- **`supabase/tests/`** (`npm run test:db`) : tests unitaires SQL contre
  un Postgres local ordinaire (contraintes, triggers, RLS), sans dépendre
  d'un projet Supabase de DEV — cf. `supabase/tests/README.md`.
- **`e2e/`** (`npm run test:e2e`, Playwright) : tests système qui
  reproduisent les parcours du front (grille Planning, Émargement…).

Mise en place initiale : infrastructure des deux suites (mini-framework
SQL maison faute de pgTAP disponible, config Playwright sur le Chromium
pré-installé) + 3 specs Playwright et 25 assertions SQL couvrant les
fonctionnalités les plus récentes (jours fériés, semaines chargées, vue
mensuelle 4/6 semaines) comme preuve de fonctionnement — pas une
couverture exhaustive de l'existant, qui reste à construire au fil des
prochains changements, conformément à la convention.
_Bug trouvé en écrivant les tests eux-mêmes, sans rapport avec les
migrations_ : le nettoyage d'un test de cascade (désactivation d'un EHPAD)
ne réactivait qu'un des 3 comptes de test désactivés par le trigger,
laissant les 2 autres désactivés pour les tests suivants — symptôme
trompeur (RLS semblant bloquer une lecture légitime). Corrigé, détail dans
`supabase/tests/README.md`.

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

- [x] **1. Vue Planning — grille principale** _(issue #2)_
  Grille salariés × jours, groupée par service puis ordre alphabétique, 4 semaines
  visibles, en-têtes jour/date grisés le week-end et jours fériés, saisie de code
  horaire en cellule.
  _Statut : fait, déployé sur Vercel (tag `DEMO-V0`)._

- [x] **2. Sélecteur de période dédié** _(issue #3)_
  Bouton dédié pour changer la période affichée (au lieu des flèches actuelles) +
  mémorisation de la période d'une ouverture à l'autre (stub `localStorage` pour la
  maquette).
  _Statut : fait, déployé sur `main`._

- [x] **3. Superposition d'un code événementiel sur un code travail** _(issue #4)_
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

- [x] **4. Sélecteur de code horaire** _(issue #5)_
  Remplacer la saisie texte libre actuelle par un sélecteur (liste déroulante /
  recherche typeahead) avec aperçu couleur, plus proche de l'outil existant montré
  dans le CDC.
  _Statut : fait, déployé sur `main`._

- [x] **5. Vue Émargement** _(issue #6)_
  Maquette de la vue mensuelle de validation du planning par le salarié : grille
  calendrier (semaines en ligne, jours en colonne comme un calendrier classique —
  revu suite au retour client), heures réalisées extrapolées des codes horaires
  (réutilise la logique de superposition événementielle de la story #3), bouton de
  validation, case signature salarié + manager et bouton Imprimer pour un format
  papier (styles `print:` dédiés masquant les éléments non pertinents sur papier).
  Accessible en cliquant sur le nom d'un salarié dans la grille planning.
  _Statut : fait, déployé sur `main`._

- [x] **6. Config — Ajouter un utilisateur** _(issue #7)_
  Formulaire maquette (type d'utilisateur, nom, prénom, service, poste).
  _Statut : fait, déployé sur `main`. Liste + formulaire (identifiant 3 lettres,
  email, type, service, poste), écran réservé à l'administrateur._

- [x] **7. Config — Ajouter un salarié** _(issue #8)_
  Formulaire maquette complet : matricule, nom, prénom, service, type de contrat,
  manager optionnel, roulement, présence.
  _Statut : fait, déployé sur `main`. Liste + formulaire (matricule 4 lettres,
  contrat CDD/CDI + actif/inactif, manager, présence).
  Champ Roulement présent mais désactivé (dépend de la story #9)._
  _Révision du 22/09 : retrait de la case « Créer un compte utilisateur » du
  formulaire — le salarié n'a pas de compte (cf. Synthèse fonctionnelle), et la
  création d'un compte utilisateur ne se fait désormais que depuis le panel
  Administration → Utilisateurs (story #6)._

- [x] **8. Config — Créer un code horaire (Admin)** _(issue #9)_
  Maquette de l'écran de création d'un code horaire : code, couleur police/fond,
  intitulé, jusqu'à 4 plages, commentaire (cf. capture CDC image1).
  Écran réservé à l'administrateur (pas d'accès utilisateur standard).
  _Statut : fait, déployé sur `main`. À revoir si besoin après retour client._

- [x] **9. Config — Créer un roulement** _(issue #10)_
  Maquette de l'écran de création d'un roulement (nombre de semaines, répartition
  des horaires dans les semaines). Chaque semaine du motif est un bloc complet
  Lundi→Dimanche (roulement aligné sur la semaine).
  _Statut : fait, déployé sur `main`. Liste + formulaire (nom, nombre de semaines
  réglable, grille de répartition réutilisant le vrai sélecteur de code horaire
  sans les codes événementiels)._

- [x] **9bis. Assigner un roulement à un salarié** _(issue #17)_
  Distincte de la story 9 (décision du 16/09) : le roulement est assigné à un
  salarié, avec une date de début (alignée sur le lundi de sa semaine) et une
  date de fin optionnelle. Vient compléter le champ Roulement désactivé de la
  story « Ajouter un salarié ». Par défaut, un salarié n'a aucun roulement.
  _Statut : fait, déployé sur `main`. Fiche salarié (Admin > Salariés
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

- [x] **9ter. Appliquer le roulement d'un salarié directement dans le planning** _(issue #17)_
  Sur une case hachurée (jamais planifiée) uniquement :
  - **Simple clic** : ouvre le sélecteur de code horaire habituel (saisie ou
    recherche d'un code) — reste l'action la plus courante, non bloquée. Si le
    salarié a un roulement actuel, un raccourci « Appliquer le roulement «
    X » » apparaît en haut du sélecteur pour l'appliquer à partir du lundi de
    la semaine visée jusqu'à la fin de la période affichée, sans ouvrir de
    second écran.
  - **Cliquer-glisser** verticalement : sélectionne plusieurs salariés sur le
    même jour, puis un panneau permet d'appliquer en une fois le roulement
    actuel de chacun (celui déjà assigné depuis sa fiche, cf. story 9bis).

  Dans les deux cas, les cases déjà remplies ne sont jamais écrasées, et les
  salariés sans roulement assigné sont signalés/ignorés plutôt que bloquants.
  _Statut : fait, déployé sur `main`. Pour cette maquette, ne
  fonctionne que pour les salariés qui ont un équivalent dans l'admin
  Salariés (Claire BERNARD, Inès LAURENT) via un pont temporaire entre les
  deux modèles (`CORRESPONDANCE_SALARIE_FICHE_DEMO`) — à supprimer une fois
  les deux entités unifiées (cf. point ouvert dédié)._
  _Révision du 16/09 : première version avec un menu de choix bloquant avant
  le sélecteur de code — retour client : la saisie d'un code doit rester
  immédiate (action la plus courante), le raccourci roulement est un ajout
  dans le même sélecteur, pas une étape supplémentaire._
  _Révision du 22/09 : pour un roulement sur plusieurs semaines, ajout d'un
  sélecteur « Démarrer à la semaine : 1 / 2 / 3 / 4 » (dans le raccourci du
  sélecteur de code, et dans le panneau de confirmation cliquer-glisser) —
  retour client : pouvoir reprendre un roulement en cours de cycle (ex.
  roulement sur 4 semaines, démarrer à la semaine 3 n'applique que les
  semaines 3 et 4 du motif). Dans le cas cliquer-glisser, le sélecteur est
  borné par le roulement le plus long parmi les salariés sélectionnés ; un
  salarié dont le roulement est plus court que la semaine de départ choisie
  est listé à part et ignoré, plutôt que d'appliquer silencieusement sa
  dernière semaine. Démo enrichie d'un 3ᵉ roulement sur 4 semaines
  (« Administratif (4 semaines) », assigné à MARTIN Julie) pour illustrer le
  cas d'usage à l'écran._
  _Révision du 22/09 (suite) : le sélecteur prenait trop de place affiché
  d'emblée dès qu'un roulement porte sur ≥ 2 semaines — retour client. Le
  raccourci reste désormais un bouton compact « Appliquer le roulement »
  par défaut (comme avant) ; pour un roulement multi-semaines, un premier
  clic dessus révèle le sélecteur de semaine de départ (au lieu d'appliquer
  directement), et un second clic sur « Appliquer » confirme._
  _Révision du 22/09 (suite, retrait) : le sélecteur de semaine de départ
  est finalement retiré du panneau cliquer-glisser multi-salariés — retour
  client : proposer un choix commun est confusant quand les salariés
  sélectionnés n'ont pas des roulements de la même longueur. Le
  cliquer-glisser applique donc de nouveau systématiquement depuis la
  semaine 1 du motif de chacun ; le sélecteur reste disponible uniquement
  sur le raccourci mono-salarié (simple clic), où il n'y a pas
  d'ambiguïté._

- [x] **9quater. Blocage semaine déjà planifiée + effacement d'une plage de codes** _(issue #17)_
  Retour client du 16/09, pour éviter les erreurs : un roulement ne peut plus
  être appliqué (raccourci ou cliquer-glisser) sur un salarié dont au moins
  une semaine de la période contient déjà un code horaire — c'est tout ou
  rien pour ce salarié (aucune semaine n'est remplie, même celles qui
  seraient libres) plutôt qu'un remplissage partiel qui a semé la confusion
  lors d'un test client (semaine suivante remplie, semaine en cours non
  remplie sans explication). L'utilisateur est notifié explicitement :
  raccourci → message bloquant nommant la semaine en cause et invitant à
  effacer d'abord ; cliquer-glisser → salariés concernés listés à part dans
  le panneau de confirmation, non appliqués.
  Pour permettre de corriger une semaine bloquante, ajout d'une sélection
  rectangulaire (cliquer-glisser sur des cases déjà remplies, une ou
  plusieurs lignes/jours) supprimable via la touche Suppr/Retour arrière ou
  un bouton "Supprimer", avec confirmation avant suppression effective.
  _Statut : fait, déployé sur `main`. Fonctionnalité admin comme le
  reste de la gestion du roulement dans le planning._
  _Révision du 16/09 : la première version appliquait quand même les
  semaines libres d'un salarié bloqué sur une autre — retour client : tout
  ou rien par salarié, avec notification explicite plutôt qu'un silence._
  _Révision du 17/09 : une case effacée (Vider la cellule, ou suppression
  d'une plage) redevient hachurée (jamais remplie) plutôt que "vidée" —
  retour client, la distinction initiale entre les deux n'avait pas anticipé
  le besoin d'effacement ; une case effacée doit redevenir disponible pour
  la planification, y compris quand elle portait une donnée de démo._
  _Correction du 17/09 : bug de fuseau horaire — `formatDateISO` utilisait
  `toISOString()` (UTC) sur des dates construites en heure locale, et
  l'application de roulement re-parsait ensuite la chaîne obtenue avec
  `new Date(chaîne)` (UTC également) ; pour un fuseau en avance sur UTC
  (ex. Europe/Paris), ce double aller-retour décalait la semaine ciblée d'une
  semaine en arrière (retour client : sélectionner le 05/10, semaine vide,
  déclenchait un blocage sur la semaine du 28/09). Corrigé en formatant et en
  reparsant les dates en heure locale (`parseDateISO` ajouté dans
  `src/lib/dates.ts`), dans tout le planning et l'émargement._
  _Correction du 17/09 : la portée de la projection (et donc de la
  vérification de blocage) allait jusqu'à la fin de la période affichée
  (jusqu'à 4 semaines) au lieu de s'arrêter après les `nbSemaines` propres au
  roulement — un salarié pouvait ainsi se voir bloqué par une semaine bien
  au-delà de la plage visée, ou voir son roulement appliqué sur plus de
  semaines que prévu (2 attendues, 3 constatées par le client). La
  planification démarre désormais sur la semaine du jour choisi et ne porte
  que sur les `nbSemaines` du roulement, ni plus ni moins._
  _Correction du 17/09 : la projection restait malgré tout plafonnée à la
  période actuellement affichée à l'écran (résidu de l'ancienne logique) —
  si la 2e semaine d'un roulement de 2 semaines dépassait cette fenêtre
  visible au moment du clic, elle n'était silencieusement jamais remplie
  (retour client : "je ne vois que la 1ère semaine", sans aucun message).
  Retiré : la projection couvre désormais les `nbSemaines` du roulement que
  ces semaines soient ou non visibles au moment de l'action._
  _Correction du 17/09 : l'effacement d'une plage ne repassait en hachuré que
  les cases portant un code travail/événementiel — un jour de repos "vidé"
  par un roulement (case blanche sans code) n'avait donc rien à "supprimer"
  et restait blanc au lieu de redevenir hachuré avec le reste de la plage
  (retour client : "le samedi dimanche reste en blanc"). Le critère est
  désormais "case pas déjà hachurée", qu'elle porte un code ou non._

- [x] **10. Config — Planifier une année** _(issue #11)_
  Maquette de l'écran de création d'année (jours fériés fixes/configurables, gestion
  année bissextile).
  _Statut : fait, déployé sur `main`. Jours fériés fixes + calculés depuis Pâques
  (algorithme de Meeus/Jones/Butcher) pour l'année choisie, jours personnalisés,
  détection bissextile. Formulaire par défaut sur 2027 pour simuler l'année
  suivante. Suppression d'une année désactivée dans l'UI (retour client du 16/09 :
  une année déjà planifiée ne doit pas pouvoir être supprimée — voir aussi le point
  ouvert "à appliquer côté backend" ci-dessous)._

- [x] **14. Consulter son profil** _(issue #15)_
  Menu utilisateur en haut à droite (nom/avatar) sur les écrans principaux, ouvrant
  un panneau de consultation du profil : type d'utilisateur, nom, prénom, service,
  poste. Lecture seule pour cette maquette (pas d'édition — à confirmer selon la
  clarification à venir sur les droits de l'utilisateur standard).
  _Statut : fait, déployé sur `main`._

- [x] **15. Config — Identité de l'EHPAD (titre + logo)** _(issue #16)_
  Écran de configuration de l'EHPAD courant : titre affiché en haut à gauche
  (remplace le libellé générique « Planning ») + upload/aperçu d'un logo. Première
  brique visuelle de la segmentation multi-EHPAD (voir section dédiée ci-dessus).
  Écran réservé à l'administrateur.
  _Statut : fait, déployé sur `main`. Logo par défaut "Les Jardins de Rambam"
  (recréé en SVG), menu admin multi-sections ajouté au passage._

- [x] **16. Vue annuelle d'un salarié** _(issue #18)_
  Permettre de visualiser sur une seule page les jours de présence d'un salarié
  sur toute une année (vue synthétique, à l'opposé de la grille planning qui
  n'affiche que 4 semaines à la fois). Ajoutée le 16/09, à faire plus tard.
  _Statut : fait sur la branche de travail, pas encore mergé. Intégrée à la vue
  émargement (`/emargement`), avec un sélecteur "Mensuel / Annuel" dans l'en-tête
  (mêmes salarié/couleurs/bouton Imprimer, sans la section signature/validation —
  cette vue n'a pas vocation à être émargée, cf. retour client du 17/09)._
  _Mise en page : grille à 12 colonnes (une par mois) et jusqu'à 31 lignes (un
  jour du mois par ligne), pour tenir les 365/366 jours sur un seul écran. Chaque
  case n'affiche qu'une couleur (pas de détail d'horaire), avec une info-bulle au
  survol (date + intitulé) ; une légende sous la grille rappelle la correspondance
  couleur → intitulé._
  _Nouveau champ admin "Afficher dans la vue annuelle" (`afficherVueAnnuelle`)
  sur le formulaire de code horaire, disponible pour toute catégorie (le client
  ne veut pas exclure un code de travail, même si a priori réservé aux absences).
  Seuls les codes cochés colorent leur jour ; codes cochés par défaut dans la démo :
  CAR, ABI, MAL, ABA, CP. Si un jour a à la fois un code travail et un code
  évènementiel cochés, l'évènementiel est prioritaire._
  _Refactor : la logique mensuelle (auparavant tout dans `EmargementContenu.tsx`)
  extraite dans `EmargementMensuel.tsx` ; nouveau `EmargementAnnuel.tsx` pour la
  grille annuelle ; `EmargementContenu.tsx` devient la coquille commune
  (en-tête, sélecteur de vue, salarié) qui rend l'un ou l'autre._

- [x] **17. Correction des codes horaires événementiels** _(issue #19)_
  Retour client du 16/09 : la gestion actuelle des codes événementiels
  (CAR/MAL/ABI superposables, CP autonome — cf. story #3) ne correspond pas
  au besoin réel et doit être corrigée ; les règles vont devoir se
  complexifier. Détail du besoin à préciser avant de démarrer.
  _Statut : fait sur la branche de travail, pas encore mergé. Retour client
  du 16/09 précisé : deux types d'évènement, configurables par code dans
  l'admin "Créer un code horaire" :_
  _- "Superposition" (comportement historique CAR/ABI/MAL) : se superpose au
  code de travail et écrase entièrement le décompte d'heures (`regleHeures`)
  — le code de travail reste visible mais est désormais barré dans la vue
  planning et dans l'émargement mensuel._
  _- "Complément à la volée" (nouveau) : une plage horaire est saisie au
  moment de positionner l'évènement sur le planning (mini-formulaire heure
  début/fin dans le sélecteur de code) ; la partie qui chevauche le code de
  travail est décomptée en heures en moins, la partie hors travail est
  ajoutée en heures en plus (delta signé calculé dynamiquement). Le code de
  travail n'est pas barré ; le delta (+Xh / -Xh) est affiché explicitement
  à côté des heures dans l'émargement mensuel, et dans l'infobulle de la
  case planning. Deux codes de type "complément à la volée" : `ABT`
  ("Absence temporaire", orange) et `HSP` ("Heures supplémentaires", vert)._
  _Le formulaire admin de création/modification d'un code horaire événementiel
  propose désormais le choix du type (avec description de chacun), et masque
  la règle de décompte d'heures pour le type "Complément à la volée" (calculée
  dynamiquement, non paramétrable)._
  _Correction du 17/09 (popover hors écran) : le popover de saisie de la
  plage horaire (comme la liste de codes) pouvait s'afficher partiellement
  hors de la fenêtre pour une case proche du bord droit/bas de l'écran,
  rendant le bouton "Ajouter" inatteignable au clic. Il se recadre désormais
  dans la zone visible une fois affiché._
  _Correction du 17/09 (bouton "Ajouter" et touche Entrée inactifs) : le
  `<input type="time">` natif peut afficher un 3e segment (AM/PM) selon la
  locale du navigateur, qui restait vide tant qu'il n'était pas choisi — la
  plage horaire ne se validait donc jamais, quel que soit le poste de
  l'utilisateur. Remplacé par deux champs texte libres (`08:00` / `10:00`,
  comme l'affichage initial demandé par le client) qui n'ont plus cette
  dépendance à la locale ; la touche Entrée valide aussi la saisie._
  _Ajout du 17/09 (retour client) : la plage saisie pour un évènement
  "complément à la volée" doit, pour chaque plage du code de travail, être
  entièrement incluse dedans (heures en moins) ou entièrement en dehors
  (heures en plus) — un chevauchement partiel avéré est ambigu et est
  refusé (ex. code 8h-18h : un évènement 16h-20h est rejeté avec un message
  explicite). Une saisie mal formée (texte libre non reconnu) n'est en
  revanche jamais bloquante — retour client du 17/09 : elle est acceptée
  telle quelle et reste simplement sans effet sur le décompte d'heures._
  _Ajout du 22/09 (retour client) : un évènement "complément à la volée"
  peut désormais porter **plusieurs plages** sur le même jour (ex. une
  arrivée anticipée le matin et un départ tardif le soir). Le mini-formulaire
  garde son visuel actuel pour une seule plage (retour client : ne pas trop
  changer le visuel) et propose un lien « + Ajouter une plage » qui insère
  une ligne supplémentaire (bouton « ✕ » pour la retirer, dès qu'il y en a
  plus d'une) ; une plage reste la valeur par défaut. Le delta affiché
  (planning et émargement mensuel) est désormais la somme des deltas de
  chaque plage, chacune validée indépendamment (incluse/exclue du code de
  travail). `ValeurCellule.evenementielPlage` (une plage) devient
  `evenementielPlages` (tableau)._
  _Redéfinition du 23/09 (nouvelle revue client) : les catégories de code
  horaire passent de 4 à 3 — Travail / Informatif / Évènementiel — la
  catégorie "Particulier" disparaît, REPOS (`.`) et ABSENCE rejoignent
  Informatif. Le couple "Superposition"/"Complément à la volée" +
  `regleHeures` implicite est remplacé par un champ `typeEvenement` explicite
  à 3 valeurs, choisi par code dans l'admin :_
  _- **spécial** (CP, MAL, CARJ, ABA) : superpose le travail et l'efface à
  l'affichage (case pleine), sans toucher à ses heures — l'infobulle
  affiche le code de travail conservé et ses heures._
  _- **normal** (ABI) : le travail reste visible mais barré, l'évènementiel
  s'affiche dessous ; une durée propre au code (`duree`, ex. 0h) remplace
  entièrement les heures du travail._
  _- **partiel** (ABT, HSP, CARP) : inchangé (ex-"Complément à la volée"),
  plages ad-hoc en delta._
  _`CAR` est retiré au profit de deux codes distincts : `CARJ` (spécial,
  carence maladie journalière) et `CARP` (partiel, carence maladie
  partielle). `ABA` (congé sans solde) est désormais explicitement rattaché
  à "spécial" comme `CP` — il n'avait auparavant aucun type d'évènement, ce
  qui le faisait remplacer toute la cellule au lieu de se superposer (bug
  latent corrigé au passage, avec le même défaut dans le formulaire admin qui
  présélectionnait silencieusement "Superposition" pour tout code sans type)._
  _Nouvelles règles de composition de cellule (jusqu'à 2 codes parmi
  travail/informatif/évènementiel, jamais les 3) : poser un travail efface
  toujours l'informatif et l'évènementiel existants ; un évènementiel ne
  peut se poser que sur une cellule ayant déjà du travail, jamais sur une
  cellule vide ; poser un évènementiel est refusé si un informatif est déjà
  présent ; un informatif peut en revanche se poser sur un évènementiel sauf
  si le travail est aussi présent. Filtrage appliqué directement dans le
  sélecteur de code (options masquées plutôt qu'erreur après coup)._
  _Modèle de données mis à jour en conséquence (cf. issue #25) : `CHECK` sur
  `code_horaire` liant `categorie`/`type_evenement`/`duree_heures`, `CHECK`
  sur `journee` empêchant un évènementiel sans travail et les 3 codes à la
  fois, nouvelle colonne `journee.code_informatif_id`, et les anciennes
  colonnes `journee.evenementiel_plage_debut/fin` remplacées par une table
  `journee_evenementiel_plage` (une ligne par plage, pour suivre l'ajout du
  22/09 ci-dessus) — détail dans l'artefact du modèle de données._
  _Correction du 23/09 (vue émargement mensuelle oubliée lors de la
  redéfinition ci-dessus) : le code informatif n'y était pas du tout affiché
  — corrigé, même règle que la grille planning (sous le travail s'il y en a
  un, en pleine case sinon)._
  _Précision du 23/09 (retour client) : sur la vue émargement mensuelle
  seulement (pas la grille planning, dont les cases sont trop petites pour
  tout montrer), le code de travail reste **toujours visible**, y compris
  avec un code événementiel spécial — la note "conservé" devenue redondante
  est retirée, le décompte d'heures du travail suffit._
  _Correction du 23/09 (données de démo, retour client) : le générateur
  aléatoire de la grille planning incluait par erreur `.` (REPOS, catégorie
  informatif) dans le pool des codes travail — un évènementiel (CP, MAL…)
  pouvait donc se retrouver visuellement superposé à un jour de repos, comme
  si REPOS était un code travail valide, ce qui n'est pas possible (un
  évènementiel exige un vrai code travail dessous). REPOS est désormais
  généré séparément, comme code informatif seul, jamais sous un
  évènementiel. Vérifié : 0 anomalie sur les 6736 cellules de démo générées._
  _Amélioration du 23/09 (retour client) : le sélecteur de code horaire
  distingue désormais clairement ses 3 catégories par un intitulé de groupe
  ("Codes de travail" / "Codes informatifs" / "Codes évènementiels"), dans
  cet ordre — auparavant seule la frontière avant les codes "superposables"
  était marquée, sans distinguer travail d'informatif ni faire apparaître
  les codes évènementiels "partiel" dans un groupe identifié._

- [x] **18. Correction de la vue émargement mensuelle** _(issue #20)_
  Retour client du 16/09, à faire après la story #17 :
  - Alignement visuel avec la (future) vue annuelle (#16) : code horaire de
    travail au-dessus du code événementiel (empilés, pas côte à côte comme
    actuellement), centrés dans la case — au lieu du rendu actuel qui les
    affiche l'un à côté de l'autre en haut à gauche de la case.
  - Afficher les plages horaires réellement effectuées chaque jour (ex.
    06:00–13:00 / 14:00–17:30, déjà définies par code horaire — cf. story #8)
    plutôt que le seul code abrégé, tout en conservant la synthèse du temps
    (total d'heures par jour et par mois, déjà présente).
  _Statut : fait sur la branche de travail, pas encore mergé. Retour client
  du 17/09 précisé (redesign complet de la case jour) :_
  _- Code travail empilé au-dessus du code événementiel (au lieu de côte à
  côte), chacun dans un badge coloré avec son code ET son intitulé (pas
  seulement le code), plus les plages horaires du code travail._
  _- Décompte horaire initial du code travail affiché, barré si un code
  évènement de superposition (CAR/MAL/ABI) l'a modifié, avec le nombre
  d'heures résultant affiché à côté dans une pastille colorée reprenant les
  couleurs du code évènement (`→ Xh`) — le simple texte coloré était
  illisible sur fond blanc pour un code à texte blanc comme CAR/MAL._
  _- Pour un évènement complément à la volée (ABT/HSP), la plage horaire
  saisie et le delta (+/-Xh) apparaissent dans le badge de l'évènement,
  dans son propre code couleur._
  _- Largeur de la vue élargie (`max-w-2xl` → `max-w-5xl`) et hauteur des
  cases augmentée pour laisser la place à ce contenu plus riche._
  _- Exemples de démonstration ajoutés (retour client : "dupliquer la même
  vue pour chaque salarié, je n'ai pas besoin de plusieurs exemples") :
  4 dates fixes de septembre 2026 (mois par défaut), identiques pour tous
  les salariés — une absence (`CP`), une superposition (`MAL`), une absence
  temporaire à la volée (`ABT`, heures en moins) et des heures
  supplémentaires à la volée (`HSP`, heures en plus)._
  _Ajout du 17/09 (retour client) : total d'heures par semaine, dans une
  colonne à droite de chaque ligne, alignée avec le total mensuel déjà
  présent en bas de la vue._

- [x] **19. Filtre d'affichage des salariés dans la vue Planning** _(issue #22)_
  Retour client du 17/09 : sélecteur en haut de la vue Planning pour
  n'afficher que certains salariés. Filtres : Tous / Présents / Non présents
  / Contrat actif / Contrat inactif / Avec planning / Sans planning (ces deux
  derniers recalculés dynamiquement selon la période affichée, à chaque
  navigation gauche/droite dans le temps).
  Point d'attention (cf. section « Points ouverts » ci-dessous) : `contratActif`
  et `presence` vivent aujourd'hui côté `FicheSalarie`, pas `Salarie` (utilisé
  par la grille Planning) — seuls 2 salariés de démo sont reliés entre les deux
  via `CORRESPONDANCE_SALARIE_FICHE_DEMO`. À traiter avant/pendant cette story.
  _Statut : fait sur la branche de travail, pas encore mergé. Le pont
  `CORRESPONDANCE_SALARIE_FICHE_DEMO` couvre désormais les 12 salariés réels
  (hors lignes "Besoin", qui n'ont pas de fiche et ne sont donc affichées que
  par le filtre "Tous") — `FICHES_SALARIES_DEMO` étendue en conséquence, avec
  un mélange volontaire de contrats actifs/inactifs et présents/non présents
  pour que chaque filtre ait au moins un exemple. Sélecteur `<select>` ajouté
  dans l'en-tête de la vue Planning ("Afficher :"). "Avec planning"/"Sans
  planning" recalculés à chaque changement de période via la même résolution
  que le rendu des cases (édition locale prioritaire sur la démo) ; testé en
  navigant au-delà de la fin des données de démo (30/09/2026) pour confirmer
  le recalcul dynamique._
  _Refonte du 22/09, retour client : le sélecteur à choix unique ne
  permettait pas de croiser plusieurs critères (ex. impossible de filtrer
  Contrat actif ET Présent en même temps). Remplacé par un filtre avancé
  multi-critères, inspiré du panneau de filtres d'HelloWork :_
  _- Bouton « Filtres » ouvrant une fenêtre à sections **Contrat** /
  **Présence** / **Manager** (nouveau, Sans manager / Maîtresse de maison /
  IDEC) / **Service** (nouveau) / **Planning (période affichée)**, chacune à
  cases à cocher. Valeurs d'un même critère combinées en OU, critères entre
  eux combinés en ET — répond explicitement au besoin client "filtrer les
  contrats actifs/inactifs ET/OU les salariés présents/non présents"._
  _- Filtres actifs affichés sous forme de jetons retirables individuellement
  sous la barre d'en-tête (comme les filtres appliqués d'HelloWork), avec un
  lien « Réinitialiser » dès que plusieurs sont actifs ; le bouton « Filtres »
  porte un badge du nombre de critères actifs, et un compteur "N salarié(s)
  affiché(s)" est visible en bas du panneau._
  _- Un salarié sans fiche (ex. lignes "Besoin") est exclu dès qu'un critère
  dépendant de la fiche (Contrat/Présence/Manager) est actif, mais reste
  filtrable par Service (disponible directement sur sa ligne, sans fiche) —
  affiné par rapport à l'ancien comportement qui excluait ces lignes dès
  qu'un filtre quelconque était actif._
  _- Nouveau composant dédié `FiltreSalariesAvance.tsx` (bouton + panneau +
  jetons), `FiltreSalarie`/`FILTRES_SALARIE` remplacés par le type
  `FiltresAvances` (un `Set` de valeurs par critère)._

- [x] **20. Ajouter le rôle Manager** _(issue #22)_
  Retour client du 23/09, première d'une liste de 6 évolutions à traiter une
  par une (chacune son propre commit). Nouveau type de compte, entre
  Administrateur et Utilisateur :
  - **Administrateur** : tous les droits, y compris l'accès au menu
    Administration (inchangé).
  - **Manager** (nouveau) : peut modifier le planning (poser/effacer un code
    sur une case — équivalent à ce que "Utilisateur" pouvait déjà faire dans
    la maquette, la sélection multiple/l'effacement groupé/l'application de
    roulement restant réservés à l'Administrateur), mais sans accès au menu
    Administration.
  - **Utilisateur** (redéfini) : consultation seule, aucune modification —
    avant cette story, un compte Utilisateur pouvait déjà ouvrir une case et
    y poser un code (aucune garde n'existait sur le clic simple, seules la
    sélection multiple et l'application de roulement étaient réservées à
    l'Administrateur) ; ce comportement bascule désormais sur Manager.
  _Statut : fait. `typeUtilisateur` étendu à 3 valeurs (`ProfilUtilisateur`,
  `Utilisateur`) ; nouvelle variable `peutEditerPlanning` (Administrateur ou
  Manager) gate l'ouverture d'une case en édition (`onClick`), remplaçant
  l'absence de garde précédente ; le lien "Administration" n'est désormais
  affiché que pour l'Administrateur (auparavant toujours visible, jamais
  testé avec un autre rôle puisque `UTILISATEUR_CONNECTE` est figé en
  Administrateur dans cette maquette sans authentification réelle). Formulaire
  et liste Admin > Utilisateurs mis à jour (3 types sélectionnables, badge de
  couleur par type). Vérifié en basculant temporairement `UTILISATEUR_CONNECTE`
  sur chacun des 3 rôles : Administrateur (tout, lien visible), Manager
  (édition OK, lien masqué), Utilisateur (case non cliquable, lien masqué)._

- [x] **21. Sélection multiple : appliquer un code sur plusieurs cases** _(issue #22)_
  Retour client du 23/09, 2e d'une liste de 6 évolutions. Deux mécanismes de
  glisser-sélection distincts coexistaient jusqu'ici, chacun limité à un type
  de case : depuis une case jamais remplie, la sélection ne portait que sur un
  seul jour (plusieurs salariés) pour appliquer leur roulement ; depuis une
  case déjà remplie, un rectangle (plusieurs jours/salariés) permettait
  uniquement d'effacer. Il fallait pouvoir sélectionner un ou plusieurs
  salariés, sur tout type de case (y compris non définies), et appliquer un
  code sur la sélection.
  _Statut : fait. Les deux mécanismes sont unifiés en un seul rectangle de
  sélection fonctionnant sur tout type de case, dont dépend un seul menu
  d'action :_
  _- **Appliquer un code…** : ouvre le sélecteur de code horaire habituel
  (nouvelle prop `valeursActuelles` sur `HoraireCodeSelector`, remplaçant
  `valeurActuelle` en sélection multiple) et applique le code choisi à
  chaque case sélectionnée (même logique de fusion que l'édition d'une
  seule case, factorisée dans `fusionnerCode`)._
  _- **Sélection hétérogène** (retour client explicite) : les garde-fous
  informatif/évènementiel exigent que TOUTES les cases sélectionnées les
  autorisent — une case évènementielle sans travail sur au moins une des
  cases sélectionnées masque entièrement la section Événementiel plutôt que
  de l'appliquer partiellement, cohérent avec le filtrage déjà en place pour
  l'édition d'une seule case. Les codes évènementiels "partiel" (plage ad hoc)
  sont masqués en sélection multiple : leur saisie ne s'applique qu'à une
  case unique._
  _- **Appliquer le roulement de chacun** : conservé, désormais affiché comme
  une option du même menu plutôt que déclenché par un mécanisme de glisser
  séparé — visible uniquement quand la sélection ne porte que sur un seul
  jour (limite déjà en place, inchangée)._
  _- **Effacer** : remet les cases sélectionnées à l'état "jamais remplie"._
  _Vérifié : glisser depuis une case vide vers une case remplie (auparavant
  impossible) ouvre bien le menu unifié ; sélection hétérogène (une case
  vide + une remplie) masque la section Événementiel ; sélection homogène
  (toutes avec travail) la fait apparaître ; le code appliqué se retrouve
  bien sur toutes les cases sélectionnées ; le roulement groupé mono-jour et
  l'effacement restent fonctionnels ; le clic simple sur une case (édition
  normale) n'est pas affecté._
  _Retrait du 23/09 (retour client) : la boîte de dialogue de confirmation de
  l'effacement multiple est retirée — ni l'effacement d'une seule case
  (bouton "Vider la cellule") ni le remplacement par un code travail n'en
  demandent, la sélection multiple ne fait pas exception. L'effacement (bouton
  ou touche Suppr/Retour arrière) est désormais immédiat._

- [x] **22. Nouvel attribut Alignement roulement sur le salarié, filtrable** _(issue #22)_
  Retour client du 23/09, 3e d'une liste de 6 évolutions. Nouvel attribut
  sur la fiche salarié : Équipe A / Équipe B / Équipe C / Équipe D, à ajouter
  au filtre de la vue Planning.
  _Statut : fait. Ajouté sur `FicheSalarie` (comme `manager`, pas sur
  `Salarie` : un salarié sans fiche, ex. les lignes "Besoin", n'a donc pas
  cet attribut et est exclu dès que ce critère est actif — même comportement
  que Contrat/Présence/Manager déjà établi en story #19). Nouveau type
  `GroupeRoulement` et constante `GROUPES_ROULEMENT` dans `mock-data.ts`,
  section ajoutée au panneau de filtres avancé (à côté de Manager), champ
  dans le formulaire Admin > Salariés (à côté de Manager) et nouvelle
  colonne dans la liste. Données de démo réparties sur les 4 valeurs pour
  couvrir chaque option du filtre._
  _Renommage du 23/09 (retour client, même jour) : d'abord demandé "Équipe
  A/B/C/D" → "Roulement A/B/C/D" (valeurs et libellé), plus réaliste.
  Attention signalée au client : le champ « Roulement » existait déjà sur la
  fiche salarié pour le motif d'horaires récurrent assigné (type
  `Roulement`, table `roulement` en base) — un même mot pour deux notions
  différentes sur le même écran. Décision initiale : garder les valeurs
  "Roulement A/B/C/D" mais distinguer le libellé du champ ("Alignement
  roulement" plutôt que "Roulement")._
  _Correction du 23/09 (typo du client, même jour) : c'est l'inverse —
  seul le **libellé du champ** devient "Alignement roulement", les
  **valeurs** restent "Équipe A/B/C/D" (jamais renommées en "Roulement").
  Champ `GroupeRoulement`/`GROUPES_ROULEMENT` gardé (le nom du champ,
  "Alignement roulement", justifie toujours des identifiants distincts du
  type `Roulement` existant), seules les 4 valeurs littérales sont
  revenues à "Équipe A/B/C/D"._
  _[Modèle de données](https://claude.ai/artifact/3sR99FsK3pjzNivG7NB8FV)
  mis à jour en conséquence (domaine B) : nouvelle colonne
  `salarie.alignement_roulement`, valeurs Équipe A/B/C/D, sans FK ni lien
  avec le domaine D (Roulements) — simple étiquette à 4 valeurs._

- [x] **23. Distinguer les jours fériés des week-ends dans l'affichage** _(issue #22)_
  Retour client du 24/09, 5e d'une liste de 6 évolutions. Les jours fériés
  et les week-ends partageaient la même couleur grise dans l'en-tête de la
  grille Planning et dans les cases de la vue mensuelle Émargement,
  impossible à distinguer au premier coup d'œil.
  _Statut : fait. Nouvelle classification à 3 états (férié / week-end /
  normal) dans `PlanningGrid.tsx` et `EmargementMensuel.tsx` (remplace le
  booléen `estJourGrise` qui fusionnait les deux) : un jour férié tombant un
  week-end reste marqué férié (priorité), pas juste grisé comme un week-end
  ordinaire. Couleur ambre pour les jours fériés (fond + texte, distincte du
  gris week-end), avec un titre HTML "Jour férié" au survol. Vérifié sur la
  grille Planning (en-tête, 2 lignes) et la vue mensuelle Émargement (cases
  du calendrier) autour du 1er et du 11 novembre 2026 (jours fériés du jeu
  de démo)._

- [x] **24. Nombre de semaines chargées configurable sur la grille Planning** _(issue #22)_
  Retour client du 24/09, 4e d'une liste de 6 évolutions. Inquiétude du
  client : une fois les accès base de données branchés, naviguer semaine par
  semaine avec les flèches multiplierait les allers-retours au serveur.
  Demande : pouvoir configurer le nombre de semaines chargées (de 4 à n),
  tout en gardant une fenêtre visible de 4 semaines avec un ascenseur
  horizontal.
  _Statut : fait, sur `PlanningGrid.tsx` uniquement (la grille Planning
  principale — distincte de la vue mensuelle Émargement salarié, cf. story
  #25). Deux réglages désormais indépendants : `NB_SEMAINES_VISIBLES` (fixe,
  4) et `nbSemainesChargees` (état, réglable de 4 à 26 via un champ dans le
  panneau de sélection de période, mémorisé en localStorage comme la
  période). Par défaut chargées = visibles : aucun ascenseur au quotidien.
  Le conteneur de la grille est plafonné en largeur à 4 semaines
  (`maxWidth`) ; au-delà, la table (rendue à sa largeur réelle grâce à un
  `width` explicite sur l'élément `<table>` — indispensable avec
  `table-layout: fixed`, sans quoi le navigateur comprime les colonnes pour
  tenir dans le conteneur au lieu de déborder) dépasse ce plafond et un
  ascenseur horizontal apparaît sous la grille.
  Les flèches de navigation défilent d'abord dans le lot déjà chargé (pur
  scroll, aucun rechargement) et ne déclenchent un changement de période
  (nouveau lot) qu'une fois le bord du lot atteint — c'est ce qui répond à
  l'inquiétude initiale : avec un lot large, l'essentiel de la navigation ne
  coûte plus rien côté données.
  Vérifié : à 4 semaines chargées (défaut) sur un écran large, aucun
  ascenseur (largeur de la grille = largeur du conteneur, à l'arrondi près).
  À 12 semaines chargées, la grille déborde bien (table 3897px dans un
  conteneur plafonné à 1432px) et 4 clics consécutifs sur la flèche
  suivante ne changent pas la période affichée dans l'en-tête (confirmation
  que la navigation reste dans le lot chargé)._

- [x] **25. Vue mensuelle salarié (Émargement) configurable 4 ou 6 semaines** _(issue #22)_
  Retour client du 24/09, 6e d'une liste de 6 évolutions — à ne pas
  confondre avec la story #24 (grille Planning principale) : deux écrans
  distincts. Demande : pouvoir choisir 4 ou 6 semaines, toutes entièrement
  visibles (pas d'ascenseur), navigation semaine par semaine, démarrage par
  défaut aligné sur le milieu du mois (en fonction d'où tombe le lundi),
  toujours un lundi en première colonne.
  _Statut : fait. `EmargementMensuel.tsx` ne s'appuie plus sur
  `genererCalendrierMois` (grille calendaire figée sur un mois civil, avec
  cases grisées de remplissage pour les jours hors mois) mais sur
  `genererPeriode` depuis un lundi de départ, sur `nbSemaines * 7` jours (4
  ou 6, bascule en haut de l'écran, mémorisée dans l'URL via `?semaines=`).
  Plus de notion de "jour hors mois" : chaque case affichée est réelle,
  l'étiquette de date passe de `jour.getDate()` à `formatJourMois` (jj/mm)
  pour rester lisible quand la fenêtre déborde sur un ou plusieurs mois
  voisins._
  _Nouveau helper `lundiLePlusProche` dans `dates.ts` (distinct de
  `lundiDeLaSemaine`, qui arrondit toujours au lundi précédent) : trouve le
  lundi le plus proche d'une date donnée. Départ par défaut = lundi le plus
  proche du 15 du mois de référence (paramètre `?mois=`, celui transmis par
  le lien depuis la grille Planning). Une fois affichée, la navigation
  (`?debut=`, `?semaines=`) prend le pas sur `?mois=`._
  _Navigation : les boutons "Mois précédent/suivant" deviennent "Semaine
  précédente/suivante" (±7 jours). Le total et le bouton de validation ne
  référencent plus "le mois" mais "la période affichée", cohérent avec une
  fenêtre qui ne correspond plus forcément à un mois civil._
  _Vérifié : `mois=2026-09` affiche par défaut 14/09–11/10/2026 (lundi le
  plus proche du 15/09, qui est un mardi) ; bascule vers 6 semaines
  conserve le même départ (14/09–25/10/2026) ; 2 clics sur "Semaine
  suivante" avancent bien de 2 semaines exactement (28/09–08/11/2026)._

## Sortie de l'Epic — WAIVED

- **Menu Export (WAIVED)** — issue #12, retirée de l'EPIC le 15/09, titre GitHub mis
  à jour le 17/09 pour porter WAIVED explicitement : la maquette du menu d'export
  accessible depuis la vue Planning avait une spécification trop imprécise pour être
  développée en l'état (contenu du menu ? formats ? périmètre des données
  exportées ?). À clarifier avec le client avant de la réintégrer dans un prochain
  Epic.
  - _Précisions client du 22/09_ (toujours partielles — formats et reste du
    périmètre non tranchés, la story reste WAIVED) : l'export doit permettre
    d'**imprimer ou exporter le planning sur une plage de dates choisie** (date
    à date, pas uniquement la période actuellement affichée à l'écran), pour un
    usage typique par un **responsable** qui veut le planning de ses salariés en
    CDI. Le type de contrat n'est donc pas figé sur CDI : l'export doit proposer
    une **sélection des types de contrat à inclure** (au moins CDI/CDD), CDI
    seul n'étant qu'un cas d'usage parmi d'autres.
- **Blocage visuel du planning passé (WAIVED)** — issue #13, sortie de l'EPIC et
  titre GitHub mis à jour le 17/09. Affichage grisé/verrouillé des cellules passées
  dans la grille (visuel uniquement, sans logique de verrouillage réelle). Mise de
  côté sans raison de spécification précisée ; à reprendre si besoin dans un
  prochain Epic.
- **Adaptation mobile de la grille (WAIVED)** — issue #14, sortie de l'EPIC et titre
  GitHub mis à jour le 17/09. Version condensée/scrollable de la grille planning
  pour écran mobile (le CDC exige un affichage web *et* mobile). Mise de côté sans
  raison de spécification précisée ; à reprendre si besoin dans un prochain Epic.

## EPIC — Fondations architecturales (backend) _(issue #23)_

**Statut : terminé (17/09)** — les 6 stories sont closes. Livrables :
[modèle de données](https://claude.ai/artifact/3sR99FsK3pjzNivG7NB8FV),
[spécification de l'API](https://claude.ai/artifact/QKjB7PgsJZXJqnDpyZSLNM),
[stratégie d'environnements](https://claude.ai/artifact/VPWH7mf82USJpNKajXagEf),
et `SYNTHESE_FONCTIONNELLE.md` (Partie 2, sections 1 à 5). La suite
(implémentation réelle du backend) relève d'un epic ultérieur.

**Objectif** : poser les bases architecturales de l'application avant d'attaquer
l'implémentation réelle du backend (Supabase) : exigences de login, modélisation
de la base de données, définition de l'API (spécification OpenAPI/Swagger), et
prise en compte de l'ajout à terme d'une seconde application (plan d'action
qualité) partageant les mêmes comptes utilisateurs. Ajoutée le 17/09.

**Nature de cet Epic** : contrairement à l'EPIC #1 (Maquette graphique v0) qui a
produit des écrans, celui-ci produit des **livrables de conception**
(spécifications, schémas, décisions documentées) qui serviront de base à
l'implémentation du backend dans un epic ultérieur.

**Décisions déjà actées (échanges du 17/09)** :
- Profils de compte : *Administrateur Système* (supervision globale, dont
  visualisation des logs), *Administrateur* (métier — directeur EHPAD ou
  adjoint, commun aux applications), *Utilisateur* (accès indépendant par
  application : aucune, une seule, ou les deux). Le salarié n'a pas de compte.
  **Mise à jour du 23/09** : un 4e profil *Manager* s'intercale entre
  Administrateur et Utilisateur — cf. story « Ajouter le rôle Manager »
  dans l'EPIC Maquette graphique ci-dessus pour son périmètre de droits
  (modification du planning, pas d'accès au menu Administration).
  [Modèle de données](https://claude.ai/artifact/3sR99FsK3pjzNivG7NB8FV)
  mis à jour en conséquence (domaine A, `compte.type_compte` passe à 3
  valeurs, `CHECK` ajouté) — avec une implication jusque-là jamais posée
  en base : la policy RLS ne peut plus se limiter au scope `ehpad_id`
  (2 niveaux de droits seulement auparavant, la distinction restait
  côté front) ; elle doit désormais aussi conditionner l'écriture selon
  `type_compte` (administrateur : tout ; manager : `journee`/
  `journee_evenementiel_plage` uniquement ; utilisateur : lecture seule)
  — détaillé dans la note « type_compte : 3 niveaux de droits ». Reste
  un modèle de conception, l'implémentation réelle des policies relève
  de l'Epic backend.
- Réinitialisation de mot de passe : l'administrateur fixe directement un
  nouveau mot de passe (flux principal, sans email) ; un flux libre-service par
  email nécessiterait un fournisseur SMTP externe (le service email intégré de
  Supabase n'est pas dimensionné pour la production).
- Architecture multi-application : un socle commun (comptes, EHPAD,
  authentification) découplé du métier Planning.
- Environnements : deux projets Supabase distincts (dev/recette + production)
  plutôt que le branching payant, cohérent avec l'objectif de minimisation des
  coûts ; environnements Vercel Production/Preview standards.

### Stories

- [x] **1. Spécifier l'authentification et la gestion des comptes** _(issue #24)_
  Types de comptes et droits, réinitialisation de mot de passe, session
  mono/multi, règles de complexité du mot de passe. Résout les points ouverts
  "nombre de types d'utilisateur et droits", "salariés = utilisateurs ou
  non", "login mono-session", "complexité du mot de passe".
  _Tranché le 17/09 : pas de restriction mono-session (multi-session
  autorisé), mais déconnexion automatique après 15 minutes d'inactivité,
  quel que soit le type de compte._
  _Tranché le 17/09 : mot de passe — longueur minimale 8 caractères, au
  moins un caractère spécial, et un indicateur de robustesse (jauge de
  complexité) qui doit passer au vert avant validation, pour écarter les
  mots de passe qui respectent les règles de format mais restent
  trivialement faibles (ex. `12345678!`)._
  _Tranché le 17/09 : réinitialisation de mot de passe — flux principal
  sans email (l'administrateur fixe directement le mot de passe). Flux
  libre-service « mot de passe oublié » par email activé via le service
  SMTP intégré de Supabase (pas de fournisseur externe pour l'instant, vu
  la taille très réduite du déploiement), en connaissance de sa limite de
  2 emails/heure par projet (tous utilisateurs confondus) et de l'absence
  de garantie de délivrabilité — acceptable car ce flux reste un confort
  secondaire non bloquant, le flux admin restant toujours disponible en
  repli. Bascule vers un fournisseur externe (ex. Brevo, gratuit jusqu'à
  300 emails/jour) possible plus tard par simple configuration, sans
  changement de code, si le besoin grandit._
  _Tous les points de cette story sont désormais tranchés._
  _Statut : fait — document de spécification rédigé (Synthèse fonctionnelle,
  Partie 2 § 1)._

- [x] **2. Modéliser la base de données** _(issue #25)_
  Unification des deux représentations actuelles du salarié, entité EHPAD et
  segmentation multi-établissement (`ehpad_id` + Row Level Security),
  traçabilité des cellules de planning + log d'audit, intégrité des règles
  métier côté serveur, notion de contrat à préciser. Résout les points
  ouverts "deux représentations du salarié", "traçabilité des cellules",
  "intégrité des données à valider côté backend", "notion de contrat".
  _Tranché le 17/09, à l'issue d'une revue de conception détaillée du
  MCD/MLD : Administrateur Système extrait en table séparée (au lieu d'un
  `ehpad_id` nullable sur `compte`) ; ajout de `ehpad_application` pour
  plafonner les applications souscrites par un établissement ; ajout d'une
  table `contrat` historisant les contrats successifs d'un salarié (un seul
  actif à la fois, garanti par index unique partiel) ; cohérence
  catégorie/code horaire garantie par trigger PostgreSQL plutôt que par le
  seul code applicatif (l'API Supabase étant directement accessible) ;
  conservation de `log_audit` comme table (préféré à des logs à plat, pour
  la requêtabilité et l'absence de filesystem persistant sur Vercel) ; les
  deux colonnes "auteur" (`journee_historique`, `log_audit`) référencent
  `auth.users.id`, partagé par `compte` et `administrateur_systeme`._
  _Statut : fait — modèle documenté dans l'
  [artifact MCD/MLD](https://claude.ai/artifact/3sR99FsK3pjzNivG7NB8FV) et
  dans la Synthèse fonctionnelle (Partie 2 § 2)._

- [x] **3. Définir l'API backend (spécification OpenAPI/Swagger)** _(issue #26)_
  Endpoints couvrant l'ensemble des écrans maquettés, conventions communes
  (erreurs, pagination, authentification, versionnement), anticipation du
  futur connecteur paie. Dépend des stories 1 et 2.
  _Tranché le 17/09 : l'essentiel de l'API n'est pas écrit à la main — elle
  est exposée directement par PostgREST (Supabase), CRUD standard sur le
  schéma (documenté par domaine plutôt que par mécanisme, pour rester
  cohérent) plus des fonctions Postgres en RPC pour la logique métier qui
  dépasse un CRUD simple (`appliquer_roulement`, `generer_annee_planifiee`),
  toutes deux sur la même base URL/authentification que le CRUD. Seules 4
  opérations, qui ont besoin de la clé serveur `service_role`, sont des
  fonctions Vercel séparées : connexion par identifiant (résolution
  `identifiant → email` côté serveur, Supabase Auth n'authentifiant
  nativement que par email), création d'un EHPAD, création d'un compte ou
  d'un Administrateur Système, réinitialisation de mot de passe — dans tous
  les cas parce que l'opération crée/modifie un utilisateur Supabase Auth ou
  lirait une donnée à ne jamais exposer à un rôle client. Traçabilité
  généralisée : un trigger générique alimente `log_audit` pour toute table
  CRUD auditée, `journee` gardant son propre trigger dédié vers
  `journee_historique` ; toute fonction RPC suit la même règle sous-jacente
  (le trigger suffit si elle écrit une table déjà auditée, sinon elle
  loggue elle-même). Documentation de l'API : écran dédié réservé à
  l'Administrateur Système plutôt qu'une route publique (rejoint l'EPIC
  #30). Petits compléments au modèle de données (issue #25, déjà close) :
  colonnes d'horodatage unifiées sous le nom `horodatage`, `DELETE`
  exceptionnel sur `contrat` réservé à l'Administrateur Système, trigger
  d'unicité de `identifiant` entre `compte` et `administrateur_systeme`._
  _Statut : fait — spécification détaillée dans l'
  [artifact API](https://claude.ai/artifact/QKjB7PgsJZXJqnDpyZSLNM), à
  résumer dans la Synthèse fonctionnelle (Partie 2 § 4)._

- [x] **4. Concevoir l'architecture multi-application** _(issue #27)_
  Socle commun (comptes, EHPAD, authentification) découplé du métier
  Planning, pour permettre le branchement d'une future application (ex. plan
  d'action qualité) partageant les mêmes comptes. Droits par application,
  point d'entrée/portail de navigation entre applications. Résout le point
  ouvert "multi-EHPAD : qui peut créer un nouvel EHPAD".
  _Tranché le 17/09 : seul l'Administrateur Système peut créer/gérer un
  EHPAD, depuis un écran dédié — liste des EHPAD existants, création en une
  seule opération tout-ou-rien (nom, logo, applications souscrites, premier
  compte Administrateur avec mot de passe fixé directement), et gestion
  ultérieure (modification des applications souscrites, désactivation sans
  suppression des données). Portail de navigation entre applications :
  entrée directe si une seule application accessible, sélecteur simple
  sinon. Petit complément au modèle de données (issue #25, déjà close) :
  ajout d'un champ `ehpad.actif`, avec désactivation en cascade de tous les
  comptes de l'EHPAD via trigger PostgreSQL._
  _Tranché le 17/09 : le logo d'un EHPAD est stocké directement en base
  (colonne `ehpad.logo_base64`, image PNG encodée en base64) plutôt que via
  Supabase Storage — une dépendance de moins à sécuriser/sauvegarder
  séparément, volume négligeable à cette échelle (un logo par
  établissement, rarement modifié), cohérence transactionnelle avec le
  reste de la fiche EHPAD. En contrepartie : upload normalisé en PNG et
  redimensionné côté client avant encodage, colonne exclue par défaut des
  requêtes de liste._
  _Statut : fait — spécification rédigée dans la Synthèse fonctionnelle
  (Partie 2 § 3) et dans l'
  [artifact MCD/MLD](https://claude.ai/artifact/3sR99FsK3pjzNivG7NB8FV)
  mis à jour._

- [x] **5. Définir la stratégie d'environnements (Vercel / Supabase)** _(issue #28)_
  Environnements Vercel (Production/Preview), deux projets Supabase distincts
  (dev/recette + production) avec migrations versionnées, gestion des
  secrets par environnement.
  _Précisé le 17/09 : les sauvegardes automatiques gérées ne sont incluses
  qu'à partir du plan Supabase Pro (25$/mois, sauvegardes quotidiennes,
  rétention 7 jours) — gratuites nulle part. Le plan Pro devient donc le
  minimum recommandé pour le projet de production (pas pour dev/recette).
  Point-in-Time Recovery disponible en option payante (100$/mois) mais
  disproportionné pour ce déploiement — une sauvegarde quotidienne suffit._
  _Tranché le 17/09 : deux branches longues synchronisées, `staging`
  (développement) et `main` (ne reçoit que des merges depuis `staging`,
  jamais de commit direct, promotion à la demande). Vercel Preview
  (`staging`, domaine fixe assigné plutôt que l'URL par commit par défaut)
  et Production (`main`), chacun avec ses propres variables pointant vers
  le bon projet Supabase. Déploiement PROD : une GitHub Action déclenchée
  par le merge sur `main` applique d'abord la migration Postgres sur le
  projet PROD, puis déclenche explicitement le déploiement Vercel via un
  deploy hook — ordre garanti, plutôt que de laisser l'intégration Git
  automatique de Vercel se déclencher indépendamment du même push. Pas de
  stratégie blue-green : aucune exigence forte de zéro interruption, et
  Vercel offre déjà une bascule quasi atomique du code applicatif._
  _Tranché le 17/09 : la story 6 (sauvegarde manuelle) est fusionnée ici —
  voir ci-dessous, un seul job quotidien sert les deux besoins._
  _Statut : fait — stratégie détaillée dans l'
  [artifact Environnements](https://claude.ai/artifact/VPWH7mf82USJpNKajXagEf)._

- [x] **6. Sauvegarde manuelle programmée (solution de démarrage)** _(issue #29)_
  Retour client du 17/09 : en attendant un éventuel passage au plan Pro,
  sauvegarde régulière programmée (`pg_dump` + cron) sur un serveur externe
  déjà disponible côté client, via la chaîne de connexion PostgreSQL directe
  exposée par Supabase (disponible même sur le plan gratuit). Couvre
  fréquence, rétention, sécurisation des identifiants, et une procédure de
  restauration testée. Solution de démarrage, non exclusive d'un passage
  ultérieur aux sauvegardes gérées de la story 5 si le besoin grandit.
  _Tranché le 17/09 : fusionnée avec la stratégie d'environnements (story 5)
  — le même job quotidien sur le serveur externe sert à la fois de
  sauvegarde PROD et de source du rafraîchissement de l'environnement
  DEV/STAGING (restore + anonymisation des données personnelles + 
  réapplication des migrations en attente sur `staging`). Chaque exécution
  réussie du refresh STAGING prouve donc, de fait, que la sauvegarde est
  restaurable — pas besoin d'un exercice de restauration séparé. Point
  laissé en suspens à la demande du client : la sécurisation du serveur
  externe lui-même (accès SSH), à traiter séparément._
  _Statut : fait — détail dans l'
  [artifact Environnements](https://claude.ai/artifact/VPWH7mf82USJpNKajXagEf),
  section « Sauvegarde & rafraîchissement quotidien de STAGING »._

## EPIC — Implémentation MVP (backend réel, PROD uniquement) _(issue #31)_

**Objectif** : faire tourner l'application maquettée contre un vrai backend
Supabase, en production, avec le domaine Vercel par défaut (pas de nom de
domaine personnalisé pour l'instant). Ajoutée le 17/09, suite à l'EPIC
« Fondations architecturales » (#23).

**Décisions actées (échanges du 17/09)** :
- Un seul environnement pour l'instant : tout se passe directement en PROD,
  pas de mise en place de DEV/STAGING pour ce MVP — reporté à l'EPIC
  « Environnements DEV/STAGING/PROD & sauvegarde » (issue #38).
- Pas de sauvegarde automatisée dans ce MVP — également reportée au même
  EPIC suivant.
- Périmètre fonctionnel : l'ensemble du contenu déjà maquetté et validé
  avec le client (Planning, Émargement mensuel/annuel, Administration
  complète, Profil utilisateur) — rien de nouveau à revalider
  fonctionnellement, seulement à brancher sur le vrai backend.

### Stories

- [x] **1. Provisionner le projet Supabase PROD** _(issue #32)_
  Création du projet, dossier `supabase/migrations/` versionné dans le
  dépôt, application du schéma complet (tables, RLS, triggers, fonctions
  RPC), données de référence (catalogue `application`).
  _Précisé le 17/09 : indexer toutes les colonnes utilisées dans les
  policies RLS (`ehpad_id` partout, FK de scoping indirect comme
  `salarie_id`) — pratique standard pour ce type d'architecture (pooled
  multi-tenant + RLS sur Supabase), sans quoi la RLS devient le premier
  goulot de performance à l'usage réel._
  _Tranché le 17/09 : projet Supabase créé en région UE (ex. Francfort),
  pour éviter un transfert de données hors UE par défaut — cf. story RGPD,
  issue #45._
  _Statut : schéma fait (24/09), création du projet lui-même à faire par
  le client. 9 migrations dans `supabase/migrations/`, une par domaine du
  [modèle de données](https://claude.ai/artifact/3sR99FsK3pjzNivG7NB8FV)
  (21 tables) plus une dédiée aux policies RLS et une au catalogue
  `application`. Fonctions RPC (`appliquer_roulement`,
  `generer_annee_planifiee`, `creer_etablissement`) pas encore écrites —
  hors périmètre de cette story, elles relèvent du branchement des écrans
  (stories #34/#35)._
  _Contraintes/triggers posés conformément aux notes de conception : les 4
  `CHECK` de `code_horaire`, les 2 `CHECK` de composition de `journee`,
  l'index unique partiel `contrat` (un seul actif par salarié), la
  cohérence catégorie ↔ code horaire (une fonction trigger générique
  paramétrée, réutilisée sur `roulement_jour` et les 3 colonnes de
  `journee`), l'unicité de `identifiant` entre `compte` et
  `administrateur_systeme`, la cascade de désactivation d'un EHPAD sur ses
  comptes, la cohérence `ehpad_application`/`compte_application`, et la
  traçabilité (`journee_historique` dédiée + fonction générique
  `log_audit` attachée aux 17 tables listées dans la note de conception)._
  _RLS activée sur les 21 tables, avec les 3 niveaux déjà spécifiés
  (administrateur_systeme transverse ; administrateur tout son EHPAD ;
  manager limité à `journee`/`journee_evenementiel_plage` en écriture ;
  utilisateur lecture seule) — dont le détail de la répartition
  administrateur/manager n'avait encore jamais été traduit en policies
  réelles avant cette story. `anon` explicitement privé de tout accès,
  `authenticated` reçoit les GRANT bruts que RLS restreint ensuite ligne
  par ligne._
  _Tout testé de bout en bout sur un Postgres local avant livraison (pas de
  Docker disponible dans cet environnement pour lancer le stack Supabase
  local, donc schéma `auth` minimal reconstitué à la main — `auth.users`,
  `auth.uid()`, rôles `anon`/`authenticated`/`service_role`) : les 9
  migrations s'appliquent sans erreur dans l'ordre ; les CHECK/triggers
  bloquent bien les cas invalides (identifiant dupliqué, type_compte
  inconnu, code évènementiel sans type_evenement, roulement_jour référençant
  un code non-travail, 2e contrat actif) et laissent passer les cas valides ;
  la cascade de désactivation d'un EHPAD désactive bien ses comptes ; la
  RLS renvoie 0 ligne en anonyme, les bonnes lignes scopées pour un
  administrateur_systeme et pour un compte administrateur d'un EHPAD (et
  aucun administrateur_systeme visible depuis ce dernier)._
  _Guide de mise en route (création du projet, réglages de sécurité,
  application des migrations, amorçage du premier compte) dans
  `supabase/README.md`._
  _Mise à jour du 25/09 : projet `planning-ehpad-prod` créé par le client
  (région Paris, `eu-west-3` — préféré à Francfort en cours de route,
  latence et hébergement France pour un client français, RGPD identique
  entre les deux), connecté via le serveur MCP Supabase (accès donné par
  le client depuis son profil Claude, contourne un blocage réseau
  spécifique à cet environnement d'exécution vers les domaines Supabase).
  Les 9 migrations appliquées sur PROD via ce MCP, puis une 10e
  (`rls_hardening`) suite à l'installation des agent skills officielles
  Supabase (`npx skills add supabase/agent-skills`, recommandé par les
  instructions du serveur MCP) et à l'audit `get_advisors` du projet :
  toutes les policies enveloppent désormais leurs appels de fonction dans
  `(select ...)` (Postgres les ré-évaluait à chaque ligne sinon — gain
  annoncé 5-10x, la vraie étendue du problème n'avait été que
  partiellement détectée par l'audit initial), `to authenticated` explicite
  sur chaque policy, les policies `for all` scindées en insert/update/
  delete pour ne plus chevaucher le select séparé (9 tables), et 4 index
  ajoutés sur clés étrangères des tables d'audit. Revoke des `EXECUTE`
  RPC directs sur les fonctions utilitaires/de trigger : incomplet dans
  cette migration (oubli du `revoke ... from public`, qui accorde
  `EXECUTE` par défaut à la création d'une fonction et n'est pas retiré
  par un simple `revoke ... from anon/authenticated`), corrigé dans la
  migration suivante. Testé localement (25/25) avant chaque application,
  conformément à la convention actée le 25/09 (`AGENTS.md` § Base de
  données) : migrations pilotées à la demande sur PROD, aucune donnée
  créée hors contenu des migrations elles-mêmes._

- [ ] **2. Implémenter l'authentification et les comptes** _(issue #33)_
  Les 4 fonctions Vercel (connexion par identifiant, création EHPAD,
  création compte, réinitialisation de mot de passe) ; amorçage manuel du
  tout premier compte Administrateur Système.
  _Statut : partiel (24/09). Seul l'amorçage manuel du tout premier compte
  Administrateur Système est fait — script `supabase/bootstrap_admin_systeme.sql`
  et procédure pas à pas dans `supabase/README.md` (créer l'utilisateur
  Supabase Auth pour `ludovic.tancerel@aiot-conseil.fr` depuis le dashboard,
  copier son UUID, l'insérer dans `administrateur_systeme`). Les 4
  fonctions Vercel (connexion par identifiant, création EHPAD, création
  compte, réinitialisation de mot de passe) restent à écrire — nécessitent
  un projet Vercel branché, hors périmètre de « juste créer le système
  admin pour démarrer et tester » demandé le 24/09._
  _Mise à jour du 25/09 : premier compte Administrateur Système amorcé
  (`ludovic.tancerel@aiot-conseil.fr`, identifiant `ltancerel`) — création de
  l'utilisateur Supabase Auth faite par le client via le dashboard (mot de
  passe jamais transmis à l'agent), ligne `administrateur_systeme` insérée
  ensuite via le script existant. Connexion branchée côté Front End : client
  Supabase (`@supabase/ssr`) côté navigateur/serveur/proxy (`src/proxy.ts`,
  remplace `middleware.ts` — renommage Next.js 16), écran `/login` (Server
  Action, message d'erreur générique) et zone protégée `/compte`
  (redirection vers `/login` si non connecté, affiche le compte connecté,
  déconnexion). Volontairement limité à cette zone : le reste de
  l'application (Planning, Émargement, Administration) tourne encore sur
  données mock, pas encore branché (stories #34/#35). Testé (25 tests DB +
  12 e2e, dont 3 nouveaux sur `/login`/`/compte` — limités aux chemins
  d'échec, aucun mot de passe réel commité dans le dépôt). Les 4 fonctions
  Vercel (au sens de la story, adaptées ici en Server Actions/Route Handlers
  Next.js) restent partielles : connexion faite, création EHPAD/compte et
  réinitialisation de mot de passe pas encore écrites._
  _Précisé le 25/09 : connexion finalement par email plutôt que par
  identifiant — utilise directement le mécanisme natif de Supabase Auth
  (déjà générique, ne distingue pas email inconnu / mot de passe incorrect)
  plutôt qu'une résolution identifiant→email maison. La fonction RPC
  `resoudre_identifiant_email` (migrations `20260925000003`/`20260925000004`)
  a été écrite puis retirée (migration `20260925000005`) une fois ce choix
  confirmé. `identifiant` reste inchangé comme champ produit à part (code 3
  lettres, déjà maquetté sur Admin > Utilisateurs et vraisemblablement la
  grille Planning) — seule la connexion n'en dépend plus._

- [ ] **3. Brancher les écrans Administration sur le backend** _(issue #34)_
  Comptes/utilisateurs, salariés, codes horaires, roulements, années/jours
  fériés, identité EHPAD, gestion des EHPAD par l'Administrateur Système,
  profil utilisateur.
  _Statut : partiel (25/09), demandé pour un premier test sur PROD. Seule la
  « gestion des EHPAD par l'Administrateur Système » est branchée — écran
  `/compte/ehpads` (création, suppression avec confirmation par saisie du
  nom vu l'absence de sauvegarde/restauration à ce stade, cf. EPIC #38).
  Contrairement à l'écran de connexion, aucune maquette n'existait pour cet
  écran précis : conçu directement ici, minimal. RLS déjà posée en
  migration 0008/hardening (aucune migration nécessaire), seulement jamais
  testée à l'écriture jusqu'ici — 4 nouveaux tests DB (administrateur
  système peut créer/supprimer, un compte administrateur simple ne peut
  ni l'un ni l'autre) + 1 e2e (redirection sans session). 29 tests DB + 13
  e2e, tous verts. Le reste de la story (comptes/utilisateurs, salariés,
  codes horaires, roulements, années/jours fériés, identité EHPAD, profil
  utilisateur) n'est pas commencé._
  _Précisé le 25/09 : la création d'EHPAD initiale n'incluait pas la
  création du premier Administrateur — repéré après un premier test réel
  sur PROD (EHPAD « Les Jardins de Rambam » créé sans personne pour le
  gérer). Corrigé pour suivre la spec API déjà conçue (`POST
  /api/admin/ehpad`, issue #26) : création atomique EHPAD + premier
  compte Administrateur, implémentée en Server Action (plutôt qu'une
  route `/api/` séparée — équivalent côté exécution serverless, évite un
  aller-retour HTTP interne inutile) dans `src/lib/supabase/admin.ts`
  (client `service_role`, jamais exposé client) et
  `src/app/compte/ehpads/actions.ts`. Nettoyage best-effort en cas
  d'échec partiel (pas de vraie transaction cross Postgres/Auth). Règles
  de mot de passe de la story #24 (8 caractères min., un caractère
  spécial, jauge de robustesse qui doit être au vert) portées dans
  `src/lib/mot-de-passe.ts`, avec jauge visuelle sur le formulaire et
  application réelle côté serveur (jamais seulement côté client).
  Nécessite `SUPABASE_SERVICE_ROLE_KEY` en variable d'environnement
  serveur (jamais `NEXT_PUBLIC_`) — pas testable en e2e automatisé ni en
  local sans cette clé, donc pas de nouveau test automatisé pour ce
  parcours précis, ajouté à `STAGING_CHECKLIST.md` à la place._
  _Précisé le 25/09 (suite) : bug repéré juste après (compte
  administrateur d'EHPAD connecté, atterrissait sur l'écran
  Administrateur Système avec badge/lien trompeurs) — corrigé,
  `/compte/*` vérifie désormais réellement `est_administrateur_systeme()`
  et affiche un écran honnête sinon. Pas une faille de sécurité : vérifié
  après coup en rejouant la requête d'insertion exacte de ce compte
  directement en base (`insufficient_privilege`, RLS), aucune ligne
  créée._
  _Démarrage du branchement du reste de la story le 25/09, à la demande
  du client (« construire plus ou moins manuellement », sans données
  fictives — les vraies données de l'EHPAD sont attendues séparément) :
  zone `/admin/*` désormais protégée par une vraie session + vérification
  du rôle `administrateur` (`src/app/admin/layout.tsx`, même principe que
  `/compte`), `UserMenu` affiche l'identité réelle du compte connecté
  (au lieu du mock `UTILISATEUR_CONNECTE`) avec une vraie déconnexion.
  Premier écran branché : **Identité EHPAD** (`/admin/ehpad`), lecture/
  écriture réelles sur `ehpad.nom`/`logo_base64`, scopées par RLS au
  propre établissement de l'administrateur (`auth_ehpad_id()`) — remplace
  l'ancien `EhpadProvider` (contexte React + localStorage) pour cet
  écran ; celui-ci reste utilisé ailleurs (Planning/Émargement, pas
  encore branchés). Redirection post-connexion corrigée pour dépendre du
  rôle réel (`/compte` pour administrateur_systeme, `/admin` pour
  administrateur, `/` en repli sinon) — jusque-là tout le monde atterrissait
  sur `/compte`. Types TypeScript générés depuis le schéma réel
  (`src/lib/supabase/database.types.ts`, `mcp__Supabase__generate_typescript_types`)
  et branchés sur les 3 clients Supabase, à régénérer à la main après
  toute migration de schéma (pas de CLI Supabase utilisable dans ce
  sandbox). Les 5 autres écrans (Codes horaires, Utilisateurs, Salariés,
  Roulements, Années) restent en mock pour l'instant, à brancher un par
  un — approche volontairement incrémentale plutôt que tout d'un coup._
  _Suite le 25/09, à la demande du client (« relier tous les écrans à la
  DB ») : **Salariés** (`/admin/salaries`) branché. Gap révélé au passage —
  aucun écran « Services » n'a jamais été prévu dans la maquette, alors que
  `service_id` est une FK obligatoire sur `salarie` (`on delete restrict`) :
  sans service existant, l'écran serait bloqué pour tout nouvel EHPAD.
  Ajouté en section compacte dans l'écran Salariés (liste + création),
  plutôt qu'un nouvel écran dédié — scope minimal. Contrat (CDI/CDD, actif)
  géré selon la règle déjà documentée dans la spec API (issue #26) :
  passer un contrat à inactif renseigne `date_fin` dans la même opération,
  côté formulaire ; changer de type pendant qu'actif clôture l'ancien et
  ouvre un nouveau (jamais deux contrats actifs, index unique partiel déjà
  en base). L'assignation de roulement reste sur données mock pour
  l'instant (dépend de l'écran Roulements, pas encore branché). 6 nouveaux
  tests DB (administrateur peut créer service/salarié/contrat et basculer
  CDI→CDD, manager ne peut ni créer de service ni de salarié). 43 tests DB,
  11 e2e, tous verts._
  _**Codes horaires** (`/admin/horaires`) branché — CRUD réel sur
  `code_horaire`/`plage_horaire` (RLS déjà correcte pour les deux, jamais
  testée à l'écriture). Formulaire mock réutilisé tel quel (`HoraireCode`
  mappait déjà proprement sur le schéma réel). Remplacement complet des
  plages à chaque modification plutôt qu'une synchronisation ligne à
  ligne (au plus 4 lignes, plus simple). Les 4 CHECK de cohérence
  categorie/type_evenement/duree_heures restent la garantie réelle,
  laissés à la base plutôt que redupliqués côté action. 4 nouveaux tests
  DB. 49 tests DB, 11 e2e, tous verts._
  _**Utilisateurs** (`/admin/utilisateurs`) branché — création réelle d'un
  utilisateur Supabase Auth via `service_role` (`auth.admin.inviteUserByEmail`,
  même client que pour le premier Administrateur d'EHPAD), sans champ mot
  de passe dans le formulaire : un email d'invitation permet au nouvel
  utilisateur de définir lui-même son mot de passe — fidèle au mock
  d'origine (« un email sera envoyé... ») et au flux libre-service déjà
  décidé (story #24, limites SMTP Supabase connues et acceptées).
  Suppression via `auth.admin.deleteUser` plutôt qu'un DELETE RLS sur
  `compte` seul : `compte.id` référence `auth.users.id` avec la cascade
  dans ce sens uniquement (utilisateur Auth supprimé → compte supprimé,
  pas l'inverse), un simple DELETE sur `compte` aurait laissé un
  utilisateur Auth fantôme (email bloqué pour une future recréation).
  Garde-fou : impossible de se supprimer soi-même depuis cet écran.
  Modification d'un compte existant : RLS directe, pas de `service_role`
  nécessaire. 4 nouveaux tests DB (création/modification par
  administrateur, refus pour un manager) — la création réelle via
  `service_role`/email n'est pas testable en local (pas de vrai GoTrue),
  ajoutée à `STAGING_CHECKLIST.md`. 53 tests DB, 11 e2e, tous verts._
  _**Roulements** (`/admin/roulements`) branché — CRUD réel sur
  `roulement`/`roulement_jour` (RLS déjà correcte pour les deux, jamais
  testée à l'écriture ; cohérence catégorie du code référencé — doit être
  "travail" — déjà testée en isolation via le trigger générique). Gap
  révélé au passage, même nature que celui des Services sur l'écran
  Salariés : `HoraireCodeSelector` (sélecteur de code utilisé pour remplir
  le motif) était câblé en dur sur la liste de démo `HORAIRE_CODES`, pas
  sur les vrais codes horaires de l'EHPAD — un nouvel EHPAD sans code
  horaire de travail créé n'aurait jamais pu constituer de motif cohérent
  avec la base. Ajouté une prop `codes` (par défaut `HORAIRE_CODES`, pour
  ne rien casser côté édition des cases du Planning, encore mock) ;
  `RoulementForm`/`RoulementsTable` reçoivent désormais les vrais codes de
  catégorie "travail" de l'établissement depuis la page serveur, plus
  d'import du mock `HORAIRE_CODES_PAR_CODE`. Remplacement complet du motif
  à chaque modification (delete + insert de `roulement_jour`), même
  approche que pour les plages horaires. Bouton de création désactivé tant
  qu'aucun code horaire de travail n'existe, avec l'explication au survol
  — même pattern que Utilisateurs/Services. Suppression : message clair si
  bloquée par `affectation_roulement` (`on delete restrict`, la
  sous-fonctionnalité d'affectation elle-même reste mock, cf. ci-dessous).
  7 nouveaux tests DB (création roulement + motif, modification,
  suppression avec cascade sur le motif, refus pour un manager en
  écriture et en modification). 60 tests DB, 11 e2e, tous verts._
  _**Années** (`/admin/annees`) branché — débloqué après accord explicite du
  client pour appliquer sur PROD la migration `generer_annee_planifiee`
  (`20260925000006`), déjà mergée sur `main` mais dont l'application avait
  été refusée une fois plus tôt dans la session ; get_advisors a relevé au
  passage un search_path non fixé sur `calculer_paques`, corrigé par une
  migration de suivi (`20260925000008`, même schéma que les corrections
  post-audit précédentes de la session) et réappliqué, audit repassé
  propre. Types TypeScript régénérés depuis le schéma réel (le RPC
  n'existait pas encore lors de la dernière génération). Création : appel
  du RPC (pose l'année + 8 jours fériés fixes + 3 calculés, tous actifs),
  puis réconciliation avec ce que le formulaire a produit — bascule actif
  sur les jours calculés, remplacement complet des jours personnalisés
  (même pattern que les plages horaires et le motif d'un roulement).
  Modification : même réconciliation, plus la mise à jour du jour de
  démarrage (l'année elle-même reste non modifiable une fois créée, comme
  dans le formulaire mock). Pas de suppression — un principe déjà du mock,
  conservé tel quel (« une année déjà planifiée ne peut pas être
  supprimée »). 6 nouveaux tests DB (le RPC lui-même avait déjà 5 tests
  dédiés depuis sa création, jamais exécutés sur une vraie réconciliation).
  66 tests DB, 11 e2e, tous verts._

- [ ] **4. Brancher les écrans Planning & Émargement sur le backend** _(issue #35)_
  Grille planning, application d'un roulement (RPC), effacement de plage,
  émargement mensuel/annuel, validation.
  _Démarré le 25/09, à la demande du client, pour que « EHPAD Validation »
  affiche une grille vraiment vide (aucun salarié) plutôt que la démo
  mock, sans données fictives — les vraies données de l'EHPAD sont
  attendues séparément. `/` exige désormais une session (comme `/compte`
  et `/admin`) et récupère salariés, services et identité EHPAD réels
  (RLS, `src/app/page.tsx`), remplaçant `SALARIES`/`SERVICES_ORDRE`/
  `UTILISATEUR_CONNECTE`/`EhpadProvider` pour cet écran — le contexte
  `EhpadProvider` (localStorage) est retiré du dépôt, plus aucun
  consommateur. Le reste (codes horaires, roulements, édition des cases,
  effacement de plage, `appliquer_roulement`) tourne encore sur les
  données de démo internes à `PlanningGrid` : n'a pas d'effet tant qu'il
  n'y a aucun salarié réel, à brancher à son tour quand de vrais salariés
  existeront. Effet de bord assumé : 4 tests e2e qui naviguaient vers `/`
  sans session ne sont plus automatisables (jours fériés sur la grille
  Planning, 3 sur les semaines chargées) — retirés/déplacés vers
  `STAGING_CHECKLIST.md`, aucun des deux comportements ne dépendant en
  réalité de salariés réels, seulement d'une session. Émargement (écran
  distinct) pas encore touché, reste en mock._
  _**Émargement** (`/emargement`) branché, à l'exception du contenu des
  cases (reste mock, comme la grille Planning — dépend de la même pièce
  finale, l'édition des cases). `/emargement` exige désormais une session
  (comme `/`, `/compte` et `/admin`) ; la résolution du salarié affiché
  passe du client (`SALARIES.find`) au serveur (`page.tsx`, RLS), avec
  repli sur le premier salarié par ordre alphabétique si l'id du paramètre
  `salarie` est absent ou introuvable, et un message « Aucun salarié »
  explicite pour un EHPAD encore vide plutôt qu'un crash. Jours fériés
  (case ambre) désormais réels (`jour_ferie` actifs, via `/admin/annees`
  juste branché) au lieu du set mock `JOURS_FERIES_2026` (qui reste
  utilisé par `PlanningGrid`, pas encore branché). Bouton « Valider la
  période » : désormais un vrai `insert` dans `validation_emargement`
  (RLS ouverte à administrateur ET manager, contrairement au groupe
  générique réservé à l'administrateur), message clair si déjà validé
  (contrainte unique). Limite assumée et documentée :
  `validation_emargement` est mensuelle (`salarie_id`, `annee`, `mois`)
  alors que la fenêtre affichée est glissante (4/6 semaines) et peut
  chevaucher deux mois — la validation porte sur le mois du premier jour
  affiché, pas de découpage par mois du bouton pour l'instant. 4 nouveaux
  tests DB (validation par administrateur et par manager, refus pour un
  utilisateur, refus d'une double validation de la même période). Effet de
  bord assumé, même nature que pour `/` : 5 tests e2e qui naviguaient vers
  `/emargement` sans session ne sont plus automatisables (fenêtre 4/6
  semaines, navigation, jour férié ambre) — déplacés vers
  `STAGING_CHECKLIST.md`, aucun ne dépendant en réalité de données de
  cellule réelles, seulement d'une session et d'une année planifiée. 70
  tests DB, 7 e2e, tous verts._
  _**Édition des cases du Planning** branchée (`/`, écriture directe et
  sélection multiple — cf. point de passage du 25/09 avant de s'y lancer,
  client d'accord pour continuer, précisant qu'il saisira lui-même le
  planning réel pour tester). Écritures réelles sur `journee` +
  `journee_evenementiel_plage` (RLS déjà correcte, administrateur ET
  manager — déjà testée à l'écriture pour `journee` dans `04_rls.sql`,
  traçabilité déjà testée dans `03_triggers.sql` ; seule
  `journee_evenementiel_plage` n'avait encore aucune assertion à
  l'écriture, 4 nouveaux tests DB). Toute la logique de fusion de case
  (poser un code, code évènementiel superposé avec ses plages à la volée,
  sélection rectangulaire, effacement) reste inchangée côté client — seule
  la source de vérité change : les fonctions utilitaires partagées
  (`heuresDuCode`, `estCodeSuperposable`, `estCodePartiel`,
  `deltaEvenementielCellule`, `heuresReellesCellule`, dans
  `src/lib/horaire-codes.ts`) ont été rendues paramétrables (un
  `codesParCode` optionnel, replié sur la liste de démo par défaut) plutôt
  que câblées en dur sur le catalogue mock — nécessaire puisque les vrais
  codes horaires d'un EHPAD diffèrent du catalogue de démo. Écriture
  optimiste : la case change à l'écran immédiatement, la persistance part
  en tâche de fond (`src/app/planning-actions.ts`,
  `enregistrerJournees`/`effacerJournees`), et revient à sa valeur d'avant
  l'édition avec un message d'erreur affiché en cas d'échec (droits
  insuffisants, réseau…) — jamais d'état affiché durablement incohérent
  avec la base. Chargement des données réelles nécessairement côté client
  (`chargerPlanningReel`, appelée à chaque changement de fenêtre affichée,
  avec un cache des fenêtres déjà chargées pour ne pas re-charger deux fois
  la même période) : la période par défaut de la grille dépend de
  préférences mémorisées en `localStorage`, jamais connue avant
  l'hydratation côté client (contrainte déjà documentée dans
  `PlanningGrid` avant même le début du branchement). Jours fériés de
  l'en-tête également branchés sur les vrais `jour_ferie` actifs (au lieu
  du set mock `JOURS_FERIES_2026`), cohérent avec l'écran Années juste
  avant. Par cohérence — éviter qu'un salarié planifié depuis la grille
  n'apparaisse pas dans sa propre vue Émargement — les vues mensuelle ET
  annuelle de l'Émargement sont branchées sur les mêmes vraies données
  (`chargerPlanningReel` réutilisée côté serveur pour Émargement, dont la
  navigation passe par de vraies URLs contrairement à la grille Planning,
  d'où un préchargement serveur possible là où la grille doit charger
  côté client). Reste explicitement en mock, incrément suivant : l'
  application d'un roulement (raccourci sur une case vide, action groupée
  sur une sélection mono-jour) — dépend de l'assignation réelle d'un
  roulement à un salarié (`affectation_roulement`, pas encore branché,
  prévu à l'origine dans l'écran Salariés) et d'une nouvelle RPC
  `appliquer_roulement` à concevoir et écrire. 4 nouveaux tests DB. 74
  tests DB, 7 e2e (rien de nouveau automatisable sans session réelle, cf.
  `STAGING_CHECKLIST.md`), tous verts._

- [ ] **5. Déployer en production** _(issue #36)_
  Projet Vercel connecté à `main`, domaine Vercel par défaut, variables
  d'environnement vers Supabase PROD, migrations appliquées avant le
  premier déploiement.

- [ ] **6. Amorcer les données réelles** _(issue #37)_
  Premier EHPAD, premier Administrateur, première saisie de référence
  (services, salariés, codes horaires), vérification du parcours complet.

- [ ] **7. Configurer une expiration de session Auth**
  _Ajoutée le 26/09, suite à une question du client : après rechargement
  de la session, aucun mot de passe redemandé._ Constaté : aucune
  configuration personnalisée dans le dépôt (les 3 clients Supabase
  utilisent les réglages par défaut) — le jeton d'accès expire au bout de
  1h mais est renouvelé silencieusement via le jeton de rafraîchissement,
  qui n'a par défaut aucune durée de vie fixe (session active
  indéfiniment tant que les cookies persistent, sans déconnexion
  explicite). Pas un problème dans l'immédiat (client explicite : « pas un
  problème pour l'instant, mais il faudra le faire — pour tester ça me
  simplifie la tâche »), mais à durcir avant un usage réel multi-compte :
  activer et régler **Time-box user sessions** / **Inactivity timeout**
  dans le dashboard Supabase (Authentication → Sessions, désactivé par
  défaut) — pas un réglage accessible en base ni par les outils MCP
  actuels, à faire depuis le dashboard. Décider de la durée avec le client
  le moment venu.

**Objectif** : mettre en œuvre la stratégie d'environnements et de
sauvegarde déjà conçue dans l'EPIC « Fondations architecturales » (#23,
stories #28/#29 — [artifact Environnements](https://claude.ai/artifact/VPWH7mf82USJpNKajXagEf)),
mise de côté pour le MVP (#31) qui tourne uniquement en PROD. Ajoutée le
17/09. EPIC d'implémentation : la conception est déjà faite.

### Stories

- [ ] **1. Créer le second projet Supabase (DEV/STAGING)** _(issue #39)_
  Même schéma que PROD (migrations du dépôt), clés dédiées.
  _Tranché le 17/09 : projet créé en région UE, comme PROD._

- [ ] **2. Mettre en place les branches et l'environnement Preview Vercel** _(issue #40)_
  Branche `staging`, Preview Vercel avec alias stable (possible sans nom de
  domaine externe), variables d'environnement vers Supabase DEV/STAGING.

- [ ] **3. Automatiser le déploiement PROD (GitHub Action + Environments)** _(issue #41)_
  Migration Supabase PROD puis déploiement Vercel via deploy hook, dans
  l'ordre ; GitHub Environments `staging`/`production` avec secrets scopés.

- [ ] **4. Sécuriser le serveur externe** _(issue #42)_
  Point resté en suspens depuis la conception : clé SSH avec passphrase,
  mot de passe désactivé, système à jour, audit de ce qui tourne par
  ailleurs sur la machine.

- [ ] **5. Mettre en place la sauvegarde quotidienne de PROD et le rafraîchissement de STAGING** _(issue #43)_
  Job cron : `pg_dump` PROD → anonymisation → restore DEV/STAGING →
  réapplication des migrations en attente. Story #29 réactivée avec son
  volet complet cette fois.

- [ ] **6. Valider le cycle complet de déploiement et de restauration** _(issue #44)_
  Un déploiement de bout en bout (staging → main → PROD) et une
  restauration testée, pour confirmer que la chaîne fonctionne avant de la
  considérer opérationnelle.
  _Ajouté le 25/09 : `STAGING_CHECKLIST.md`, liste des vérifications
  manuelles à faire sur STAGING (parcours qui exigent une connexion
  réussie, donc pas automatisables sans committer un mot de passe réel —
  cf. `e2e/connexion.spec.ts`). Démarré avec l'authentification et la
  gestion des EHPAD par l'Administrateur Système (stories #33/#34), à
  compléter au même rythme que ces stories avancent._

- [ ] **7. Mettre en place la politique RGPD de l'éditeur** _(issue #45)_
  Ajoutée le 17/09. Recentrée le 17/09 : la relation EHPAD ↔ salariés (dont
  sa base légale) relève de la responsabilité de l'EHPAD, responsable de
  traitement — hors périmètre. Notre rôle, en tant que sous-traitant, est
  de fournir la policy et les garanties sur lesquelles l'EHPAD s'appuie
  pour justifier sa propre conformité :
  - Modèle de **clause de sous-traitance RGPD (Art. 28)**, signée par
    chaque EHPAD à l'onboarding (objet/durée/finalité du traitement,
    obligations du sous-traitant, liste des sous-traitants ultérieurs
    Supabase/Vercel, point de contact RGPD).
  - Hébergement UE (✅ tranché), sécurité Art. 32 (chiffrement, RLS, mots
    de passe hashés, audit) et anonymisation STAGING — déjà couverts par
    l'architecture, à documenter comme preuves de conformité.
  - Procédure de notification de violation de données (72h CNIL).
  - Politique de conservation/purge des données que nous portons
    techniquement (aucune définie à ce jour) et registre des activités de
    traitement côté éditeur.
  Hors périmètre, laissé à la charge de l'EHPAD : sa propre base légale,
  son registre, l'information de ses salariés et l'exercice de leurs
  droits (nous fournissons les moyens techniques, pas la démarche), et la
  nécessité d'un DPO côté EHPAD.

## Idées pour epics futurs (hors périmètre maquette graphique v0)

- **EPIC — Administration Système (logs, statistiques d'usage & doc API)**
  _(issue #30)_ — ajouté le 17/09, non prioritaire. Outiller le compte
  Administrateur Système (défini dans l'EPIC #23) avec des écrans de
  supervision technique transverse à tous les EHPAD : visualisation des
  logs (journal d'audit `log_audit`, cf. issue #25, et logs applicatifs),
  statistiques d'utilisation de l'application (indicateurs à définir avec
  le client), et consultation de la documentation de l'API (type
  Swagger/Redoc, cf. issue #26 — décidé le 17/09 plutôt qu'une route
  publique, faute de consommateur tiers de cette API). À détailler en
  stories et prioriser après l'EPIC « Fondations architecturales » (#23) et
  son implémentation backend.

- **Mettre en place une suite de tests automatisés rejouables (Playwright)**
  _(issue #21)_ — ajouté le 17/09, décision du client. Pendant la maquette,
  les vérifications de non-régression sont faites via des scripts Playwright
  ponctuels (dossier temporaire hors dépôt), non commités et non rejouables.
  À remplacer par une vraie suite e2e commitée dans le dépôt (`npm run
  test:e2e`), couvrant les parcours déjà validés manuellement (planning,
  codes événementiels, émargement, roulements, config). Volontairement hors
  périmètre de l'EPIC #1 : à traiter lors de la mise en place du backend,
  une fois la maquette graphique figée sur une première version.

- **Export PDF téléchargeable** (ajouté le 15/09, suite à la case signature de la
  vue émargement) : au-delà de l'impression navigateur déjà en place
  (`window.print()`, qui permet déjà d'enregistrer en PDF via le navigateur), un
  vrai bouton « Télécharger le PDF » nécessiterait une génération côté serveur
  (ex: Puppeteer/Playwright headless, ou une lib type `react-pdf`) puisque
  l'application n'a pas encore de backend. À prévoir dans l'Epic backend, probablement
  en même temps que la story Menu Export (#12, sortie de l'Epic v0 en attente de
  clarification — voir section dédiée ci-dessus).

## Points ouverts (hors périmètre maquette graphique, à trancher avant le backend)

_Les points ci-dessous sont désormais pris en charge par l'EPIC « Fondations
architecturales (backend) » (issue #23) ci-dessus — conservés ici pour mémoire
jusqu'à leur résolution effective._

- Nombre de types d'utilisateur (2 vs 3) et droits exacts de l'utilisateur standard
  — _cf. story « Spécifier l'authentification et la gestion des comptes »,
  issue #24._
- Salariés = utilisateurs de l'app ou simples lignes de planning ? — _cf. issue #24._
- ~~Login mono-session : pertinent ?~~ → **tranché le 17/09** : multi-session
  autorisé, déconnexion automatique après 15 min d'inactivité — _cf. issue #24._
- ~~Notion de contrat à préciser~~ → **tranché le 17/09** : table `contrat`
  dédiée, historisant les contrats successifs d'un salarié, un seul actif à
  la fois — _cf. issue #25._
- ~~Complexité du mot de passe à définir~~ → **tranché le 17/09** : 8
  caractères min., 1 caractère spécial min., indicateur de robustesse au
  vert obligatoire — _cf. issue #24._
- ~~Multi-EHPAD : qui peut créer un nouvel EHPAD ?~~ → **tranché le 17/09** :
  l'Administrateur Système, depuis un écran dédié de création/gestion des
  EHPAD — _cf. issue #27._
- ~~**Deux représentations distinctes du salarié dans la maquette**~~ (relevé
  le 16/09 en construisant la story 9bis) → **tranché le 17/09** : un modèle
  `salarie` unique dans le schéma backend (table `salarie`, cf. issue #25) ;
  le pont temporaire `CORRESPONDANCE_SALARIE_FICHE_DEMO` reste un artefact de
  la maquette, à abandonner lors du passage au vrai backend.
- ~~**Intégrité des données à valider côté backend, pas seulement côté
  front**~~ (retour client du 16/09) → **tranché le 17/09** : les règles qui
  ne peuvent pas s'exprimer par une simple contrainte sur une table (ex. « un
  seul contrat actif par salarié », cohérence catégorie/code horaire) sont
  garanties en base par index/contraintes/triggers PostgreSQL, et non
  seulement côté applicatif — l'API PostgREST de Supabase étant directement
  accessible, le code applicatif seul ne suffit pas. — _cf. issue #25._
- ~~**Traçabilité des cellules du planning**~~ (précisé par le client le
  17/09) → **tranché le 17/09** : table `journee_historique` (append-only,
  valeurs successives d'une cellule) + `log_audit` (journal générique des
  opérations), auteur référencé via `auth.users.id`. — _cf. issue #25._
