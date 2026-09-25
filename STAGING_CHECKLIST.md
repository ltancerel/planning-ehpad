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

## Régression — écrans encore non branchés

- [ ] La grille Planning (`/`), l'Émargement et le reste de
      l'Administration continuent d'afficher les données mock, sans
      exiger de connexion — comportement attendu tant que les stories
      #34 (reste) et #35 ne sont pas faites. À retirer de cette section
      au fur et à mesure qu'un écran est effectivement branché (et à
      transformer en scénario « doit exiger une session » à la place).
