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
- Trois profils de compte : *Administrateur Système* (supervision globale, dont
  visualisation des logs), *Administrateur* (métier — directeur EHPAD ou
  adjoint, commun aux applications), *Utilisateur* (accès indépendant par
  application : aucune, une seule, ou les deux). Le salarié n'a pas de compte.
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

- [ ] **1. Provisionner le projet Supabase PROD** _(issue #32)_
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

- [ ] **2. Implémenter l'authentification et les comptes** _(issue #33)_
  Les 4 fonctions Vercel (connexion par identifiant, création EHPAD,
  création compte, réinitialisation de mot de passe) ; amorçage manuel du
  tout premier compte Administrateur Système.

- [ ] **3. Brancher les écrans Administration sur le backend** _(issue #34)_
  Comptes/utilisateurs, salariés, codes horaires, roulements, années/jours
  fériés, identité EHPAD, gestion des EHPAD par l'Administrateur Système,
  profil utilisateur.

- [ ] **4. Brancher les écrans Planning & Émargement sur le backend** _(issue #35)_
  Grille planning, application d'un roulement (RPC), effacement de plage,
  émargement mensuel/annuel, validation.

- [ ] **5. Déployer en production** _(issue #36)_
  Projet Vercel connecté à `main`, domaine Vercel par défaut, variables
  d'environnement vers Supabase PROD, migrations appliquées avant le
  premier déploiement.

- [ ] **6. Amorcer les données réelles** _(issue #37)_
  Premier EHPAD, premier Administrateur, première saisie de référence
  (services, salariés, codes horaires), vérification du parcours complet.

## EPIC — Environnements DEV/STAGING/PROD & sauvegarde _(issue #38)_

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
