# Checklist de vérification manuelle — STAGING

Complète les suites automatisées (`npm run test`) sur ce que celles-ci ne
peuvent pas couvrir sans committer un secret réel dans le dépôt — en
premier lieu, tout parcours qui exige une connexion réussie avec un vrai
mot de passe (cf. `e2e/connexion.spec.ts`, volontairement limité aux
chemins d'échec). À exécuter à la main sur l'environnement STAGING, une
fois qu'il existe (EPIC « Environnements DEV/STAGING/PROD », issue #38,
en particulier la story #44 « Valider le cycle complet de déploiement et
de restauration »).

Principe : chaque nouvelle fonctionnalité qui touche à l'authentification
ou aux permissions ajoute ses scénarios ici, au même rythme que les tests
automatisés en accompagnent le code (`AGENTS.md` § Tests). Cocher au fur
et à mesure d'une exécution ; remettre à zéro pour la suivante.

## Pré-requis

- Un compte Administrateur Système existant sur STAGING (créé via la
  procédure `supabase/README.md` § 4, adaptée au projet STAGING).
- Idéalement, au moins un compte `administrateur` d'un EHPAD existant sur
  STAGING, pour les scénarios de restriction de droits — sinon les créer
  au fil des tests (story #34/#35 le permettra une fois branchée).

## Authentification (story #33)

- [ ] Se connecter sur `/login` avec l'email et le mot de passe réels de
      l'Administrateur Système → atterrit sur `/compte`, nom affiché.
- [ ] Se déconnecter depuis `/compte` → retour à `/login`.
- [ ] Visiter `/compte` sans être connecté → redirection automatique vers
      `/login`.
- [ ] Se connecter avec le bon email et un mauvais mot de passe → message
      générique, reste sur `/login` (couvert par e2e, à revérifier une
      fois en conditions réelles).
- [ ] Une fois connecté, revisiter `/login` → redirection automatique vers
      `/compte` (pas de formulaire de connexion affiché à un utilisateur
      déjà connecté).

## Gestion des EHPAD par l'Administrateur Système (story #34, tranche EHPAD)

- [ ] Depuis `/compte`, cliquer « Gérer les EHPAD » → liste (vide ou
      existante) affichée.
- [ ] Créer un EHPAD en renseignant aussi le premier Administrateur (nom,
      prénom, identifiant 3 lettres, email, mot de passe) → l'EHPAD
      apparaît dans la liste, ET un utilisateur Supabase Auth + une ligne
      `compte` (type `administrateur`) sont créés pour cet EHPAD.
      Nécessite `SUPABASE_SERVICE_ROLE_KEY` côté serveur (pas testable
      sans, ni en local ni en e2e automatisé).
- [ ] Se connecter avec cet Administrateur d'EHPAD (pas l'Administrateur
      Système) sur `/login` → atterrit sur `/compte`, mais voit un écran
      « zone réservée à l'Administrateur Système », PAS le badge
      « Administrateur Système » ni le lien « Gérer les EHPAD » (bug
      corrigé le 25/09, repéré après un test réel avec le compte
      `ltancerel@gmail.com`).
- [ ] Vérifier que ce nouvel Administrateur peut se connecter sur `/login`
      avec l'email et le mot de passe saisis à la création.
- [ ] Tenter de créer un EHPAD avec un nom vide → message d'erreur, aucune
      création.
- [ ] Tenter un mot de passe faible pour l'administrateur (ex.
      `12345678!`) → jauge de robustesse rouge, bouton de création non
      bloqué côté client mais refus côté serveur avec message clair (la
      validation cliente n'est qu'un confort, la règle réelle est
      appliquée côté serveur).
- [ ] Tenter un identifiant administrateur déjà utilisé par un autre
      compte ou administrateur système → erreur claire, ET vérifier que
      l'EHPAD nouvellement créé et l'utilisateur Auth ont bien été
      nettoyés (pas de ligne orpheline) — la création n'étant pas une
      vraie transaction cross Postgres/Auth, ce nettoyage est fait à la
      main par le code, pas garanti par la base.
- [ ] Cliquer « Supprimer » sur un EHPAD → le bloc de confirmation
      apparaît, le bouton reste désactivé tant que le nom saisi ne
      correspond pas exactement.
- [ ] Saisir le nom correct puis confirmer → l'EHPAD disparaît de la
      liste ; vérifier en base (ou via un futur écran) que les données
      dépendantes (comptes, salariés, planning) ont bien été supprimées en
      cascade.
- [ ] Avec un compte `administrateur` d'EHPAD (pas Administrateur
      Système) connecté : visiter `/compte/ehpads` → aucune création ni
      suppression possible (RLS), cohérent avec le fait que cet écran est
      réservé à l'Administrateur Système.

## Administration d'un EHPAD par son Administrateur (story #34, écran Identité)

- [ ] Se connecter avec un compte `administrateur` d'EHPAD (pas
      Administrateur Système) → redirection automatique vers `/admin`
      (pas `/compte`, corrigé le 25/09 — avant ce correctif tout compte
      atterrissait sur `/compte`, réservé au System Admin).
- [ ] Avec ce même compte, visiter `/compte` directement → écran « zone
      réservée à l'Administrateur Système », pas les commandes système.
- [ ] Sur `/admin/ehpad`, le nom de l'EHPAD affiché correspond à celui
      saisi à la création (`/compte/ehpads`), le logo est vide (jamais
      renseigné) — c'est l'état attendu pour un nouvel EHPAD, pas une
      donnée manquante par erreur.
- [ ] Modifier le nom et/ou ajouter un logo, Enregistrer → persiste
      réellement (recharger la page confirme, pas juste l'état local du
      formulaire).
- [ ] Se déconnecter puis revisiter `/admin/ehpad` sans session →
      redirection vers `/login`.
- [ ] Avec un compte `manager` ou `utilisateur` (pas `administrateur`)
      connecté : visiter `/admin/ehpad` → écran « zone réservée au rôle
      Administrateur », pas le formulaire d'édition.

## Grille Planning sur données réelles (story #35, démarrage — 25/09)

`/` exige désormais une session (comme `/compte` et `/admin`) et affiche
les salariés/services réels de l'EHPAD connecté, plus l'identité réelle
(nom/logo) — plus de données mock pour les lignes et l'en-tête. Le reste
(codes horaires, roulements, édition des cases) tourne encore sur les
données de démo, mais ça ne s'exerce pas tant qu'il n'y a aucun salarié
réel. Les 3 scénarios suivants ont dû être retirés de la suite e2e
automatisée (nécessitent une session réelle) — ils ne dépendent PAS de
salariés réels, juste d'être connecté, donc testables dès maintenant même
avec un EHPAD vide :

- [ ] Connecté sur `/`, avec « EHPAD Validation » (ou tout EHPAD sans
      salarié) : grille vide (aucune ligne), pas la démo (Marie Dupont
      etc.), en-tête avec le vrai nom/logo de l'EHPAD.
- [ ] En-tête de la grille : un jour férié (ex. 01/11/2026, via le
      sélecteur de période) est marqué ambre avec l'infobulle « Jour
      férié », un week-end ordinaire (ex. 07/11/2026) reste gris sans
      cette infobulle.
- [ ] Par défaut, 4 semaines chargées = 4 visibles, aucun ascenseur
      horizontal ; à 12 semaines chargées (réglage dans le sélecteur de
      période), la grille déborde et un ascenseur apparaît.
- [ ] Les flèches ← → défilent dans le lot déjà chargé sans redéclencher
      de chargement tant que le bord n'est pas atteint (le libellé de
      période affiché ne change pas après quelques clics).
- [ ] Se déconnecter puis revisiter `/` sans session → redirection vers
      `/login` (couvert par e2e, à revérifier une fois en conditions
      réelles).

## Salariés (story #34, écran /admin/salaries — 25/09)

- [ ] Sur un EHPAD sans service : le bouton « + Nouveau salarié » est
      désactivé, la liste des services affiche « aucun ».
- [ ] Créer un service via le champ dédié → apparaît immédiatement dans la
      liste de chips.
- [ ] Créer un salarié (matricule 4 lettres, service, type de contrat,
      manager, alignement roulement, présence) → apparaît dans le tableau ;
      recharger la page confirme la persistance.
- [ ] Modifier ce salarié, notamment repasser son contrat à « inactif » →
      `date_fin` posée en base (vérifiable via une requête, pas encore
      affichée à l'écran) ; le rebasculer sur un autre type de contrat
      (CDD→CDI) en le laissant actif → un seul contrat actif à la fois.
- [ ] Supprimer un salarié → disparaît du tableau.
- [ ] Avec un compte `manager` ou `utilisateur` connecté : `/admin/salaries`
      affiche l'écran « zone réservée », pas le formulaire.
- [ ] Le salarié créé apparaît maintenant comme ligne sur la grille
      Planning (`/`), dans le bon groupe de service.

## Codes horaires (story #34, écran /admin/horaires — 25/09)

- [ ] Créer un code de catégorie « Travail » avec 1 à 4 plages horaires →
      apparaît dans le tableau avec la durée calculée ; recharger confirme
      la persistance.
- [ ] Créer un code « Événementiel » de chaque type (spécial, normal,
      partiel) → les champs spécifiques (action, durée pour "normal")
      s'enregistrent correctement.
- [ ] Tenter une combinaison incohérente que le formulaire laisserait
      passer (ex. via manipulation directe) → la base la refuse (CHECK),
      message d'erreur affiché plutôt qu'un échec silencieux.
- [ ] Modifier un code existant, notamment changer son nombre de plages →
      les anciennes plages sont bien remplacées, pas cumulées.
- [ ] Supprimer un code horaire → disparaît du tableau, ses plages
      supprimées en cascade.
- [ ] Avec un compte `manager` ou `utilisateur` connecté : `/admin/horaires`
      affiche l'écran « zone réservée », pas le formulaire.

## Régression — écrans encore non branchés

- [ ] L'Émargement (`/emargement`) continue d'afficher les données mock,
      sans exiger de connexion — comportement attendu tant que le reste
      de la story #35 n'est pas fait.
- [ ] Les 3 autres écrans `/admin/*` (Utilisateurs, Roulements, Années)
      exigent maintenant une session et le rôle `administrateur` (layout
      partagé), mais leur contenu reste encore en données mock — à retirer
      de cette section un par un au fur et à mesure de leur branchement,
      et à transformer en scénario de vérification des données réelles à
      la place.
- [ ] Sur l'écran Salariés lui-même, la section « Roulement » (assigner un
      roulement à un salarié) reste sur données mock — dépend de l'écran
      Roulements, pas encore branché.
