# Base de données Supabase — mise en route

Ce dossier contient les migrations versionnées (`migrations/`) qui posent
l'intégralité du schéma décrit dans le
[modèle de données](https://claude.ai/artifact/3sR99FsK3pjzNivG7NB8FV) : 21
tables réparties en 7 domaines, contraintes `CHECK`, triggers (cohérence
catégorie/code horaire, cascade de désactivation, traçabilité), policies RLS
à 3 niveaux (administrateur/manager/utilisateur) et catalogue `application`
de référence. Testé de bout en bout sur un Postgres local avant livraison
(contraintes, triggers, RLS anonyme/administrateur_systeme/compte).

Correspond aux stories #32 (*Provisionner le projet Supabase PROD*) et,
pour l'amorçage du compte, #33 (*Implémenter l'authentification et les
comptes*) du BACKLOG — un seul environnement pour l'instant (pas de
DEV/STAGING, décision du 17/09), le reste de la story #33 (les 4 fonctions
Vercel) et les stories #34/#35 (brancher les écrans) restent à faire.

## 1. Créer le projet Supabase

1. Créer un compte sur [supabase.com](https://supabase.com) si besoin.
2. **New project** — région **EU West (Frankfurt)** impérativement (RGPD,
   décision actée pour la story RGPD, issue #45 : éviter un transfert de
   données hors UE par défaut).
3. Nom suggéré : `planning-ehpad-prod`. Générer un mot de passe de base de
   données fort et le stocker dans un gestionnaire de mots de passe — il
   sert à la connexion Postgres directe (migrations, sauvegardes), jamais
   à l'application.
4. Plan **Free** suffit pour démarrer/tester. Le plan **Pro** (25$/mois,
   sauvegardes quotidiennes) est la recommandation déjà actée (story #28)
   avant d'y mettre de vraies données de production — pas nécessaire tant
   qu'il s'agit de test.

## 2. Réglages de sécurité à faire AVANT toute donnée réelle

Tous dans **Authentication** (menu de gauche du dashboard) :

- **Authentication → Sign In / Providers → Email** : désactiver **"Allow
  new users to sign up"**. Indispensable — l'application n'a aucune
  inscription libre-service, tous les comptes sont créés par un
  administrateur (cf. modèle de données, domaine A). Sans ça, n'importe
  qui pourrait créer un compte Supabase Auth qui ne correspondrait à aucune
  ligne `compte`/`administrateur_systeme` (inoffensif grâce à RLS, mais
  aucune raison de laisser la porte ouverte).
- **Authentication → URL Configuration** : à renseigner plus tard, une
  fois l'app déployée sur Vercel (Site URL + Redirect URLs) — pas
  bloquant pour l'instant.
- **Project Settings → API** : noter l'URL du projet, la clé `anon`
  (publique, ira dans le futur `.env` du front) et la clé `service_role`
  (secrète — **ne jamais** la coller dans un fichier du dépôt, un
  `NEXT_PUBLIC_*`, ou ailleurs qu'une variable d'environnement serveur).

**Point d'attention pour plus tard** (pas un réglage Supabase) : la
déconnexion automatique après 15 minutes d'inactivité (décidée le 17/09)
n'est pas un paramètre du dashboard — c'est une minuterie à implémenter
côté front (story #33/#38), distincte de la durée de vie du jeton JWT
(1h par défaut, se rafraîchit tout seul tant que l'utilisateur est actif).

RLS est déjà activée par les migrations sur les 21 tables — rien à faire
manuellement côté dashboard pour ça.

## 3. Appliquer les migrations

Deux méthodes, au choix :

### Via la Supabase CLI (recommandé, garde la trace de ce qui est appliqué)

```bash
npx supabase login
npx supabase link --project-ref <ref-du-projet>   # trouvable dans l'URL du dashboard
npx supabase db push
```

`db push` applique dans l'ordre tous les fichiers de `migrations/` qui ne
sont pas encore marqués comme appliqués sur le projet distant.

### Via l'éditeur SQL du dashboard

Coller et exécuter, dans l'ordre, chaque fichier de `migrations/` (l'ordre
est donné par le préfixe numérique du nom de fichier). Fonctionne, mais ne
garde aucune trace côté Supabase de ce qui a été appliqué — la CLI est
préférable dès que possible.

## 4. Créer le premier Administrateur Système

1. **Authentication → Users → Add user**, avec :
   - Email : `ludovic.tancerel@aiot-conseil.fr`
   - Mot de passe : en définir un temporaire fort, à changer à la première
     connexion (pas de flux "mot de passe oublié" nécessaire ici).
   - Cocher **Auto Confirm User** (évite d'avoir besoin d'un email de
     confirmation fonctionnel à ce stade).
2. Copier l'**UUID** de l'utilisateur créé (colonne `UID` dans la liste,
   ou dans le détail de l'utilisateur).
3. Ouvrir `supabase/bootstrap_admin_systeme.sql`, remplacer
   `<UUID_AUTH_USER>` par cet UUID, coller le contenu dans l'éditeur SQL du
   dashboard et l'exécuter. Ce n'est pas une migration versionnée : elle
   dépend d'un UUID qui n'existe qu'après l'étape 1, donc jouée à la main,
   une seule fois.
4. Vérifier : `select * from administrateur_systeme;` doit renvoyer la
   ligne créée, avec `actif = true`.

À ce stade, la base est prête et le compte système existe. Se connecter
avec cet email/mot de passe ne fonctionnera que depuis l'application une
fois les écrans branchés sur ce projet (stories #33 à #35, pas encore
faites) — mais tu peux dès maintenant vérifier la base elle-même depuis le
dashboard (Table Editor, SQL Editor) ou un client Postgres classique avec
la chaîne de connexion directe (Project Settings → Database).
