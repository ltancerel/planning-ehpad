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
  contrat CDD/CDI + actif/inactif, manager, présence, compte utilisateur optionnel).
  Champ Roulement présent mais désactivé (dépend de la story #9)._

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

- [ ] **19. Filtre d'affichage des salariés dans la vue Planning** _(issue #22)_
  Retour client du 17/09 : sélecteur en haut de la vue Planning pour
  n'afficher que certains salariés. Filtres : Tous / Présents / Non présents
  / Contrat actif / Contrat inactif / Avec planning / Sans planning (ces deux
  derniers recalculés dynamiquement selon la période affichée, à chaque
  navigation gauche/droite dans le temps).
  Point d'attention (cf. section « Points ouverts » ci-dessous) : `contratActif`
  et `presence` vivent aujourd'hui côté `FicheSalarie`, pas `Salarie` (utilisé
  par la grille Planning) — seuls 2 salariés de démo sont reliés entre les deux
  via `CORRESPONDANCE_SALARIE_FICHE_DEMO`. À traiter avant/pendant cette story.

## Sortie de l'Epic — WAIVED

- **Menu Export (WAIVED)** — issue #12, retirée de l'EPIC le 15/09, titre GitHub mis
  à jour le 17/09 pour porter WAIVED explicitement : la maquette du menu d'export
  accessible depuis la vue Planning avait une spécification trop imprécise pour être
  développée en l'état (contenu du menu ? formats ? périmètre des données
  exportées ?). À clarifier avec le client avant de la réintégrer dans un prochain
  Epic.
- **Blocage visuel du planning passé (WAIVED)** — issue #13, sortie de l'EPIC et
  titre GitHub mis à jour le 17/09. Affichage grisé/verrouillé des cellules passées
  dans la grille (visuel uniquement, sans logique de verrouillage réelle). Mise de
  côté sans raison de spécification précisée ; à reprendre si besoin dans un
  prochain Epic.
- **Adaptation mobile de la grille (WAIVED)** — issue #14, sortie de l'EPIC et titre
  GitHub mis à jour le 17/09. Version condensée/scrollable de la grille planning
  pour écran mobile (le CDC exige un affichage web *et* mobile). Mise de côté sans
  raison de spécification précisée ; à reprendre si besoin dans un prochain Epic.

## Idées pour epics futurs (hors périmètre maquette graphique v0)

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
  (fiche salarié). Un pont temporaire (`CORRESPONDANCE_SALARIE_FICHE_DEMO`,
  ajouté pour la story 9ter) relie les deux id pour les 2 salariés qui
  existent des deux côtés (Claire BERNARD, Inès LAURENT), afin que le
  planning puisse retrouver leur roulement actuel — à supprimer au profit
  d'un seul modèle Salarié lors du passage au vrai backend, qui couvrira
  alors tous les salariés sans pont temporaire.
- **Intégrité des données à valider côté backend, pas seulement côté front**
  (retour client du 16/09, suite à la suppression d'une année dans la maquette) :
  toute règle du type "on ne peut pas supprimer X" doit être appliquée côté serveur
  (contrainte DB / policy Supabase / vérification API), le front ne pouvant être
  qu'un confort UX — contournable via appel direct à l'API, DevTools, etc. À
  reprendre explicitement dans les specs backend pour chaque règle de suppression
  déjà mockée côté front (années, et sans doute plus tard salariés/utilisateurs
  avec historique).
- **Traçabilité des cellules du planning** (précisé par le client le 17/09) :
  le modèle de données backend devra historiser chaque modification d'une
  cellule de planning, pour pouvoir récupérer via l'API l'ensemble des
  valeurs successivement prises par une cellule (sans que cet historique soit
  utilisé côté front pour l'instant). Toutes ces opérations (création,
  modification, effacement, application d'un roulement...) devront aussi être
  journalisées côté backend (log d'audit), au-delà du seul historique de
  valeurs. À intégrer dans le schéma de la table planning/journée lors de la
  conception du backend.
