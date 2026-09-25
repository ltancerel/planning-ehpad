# Tests unitaires base de données

Vérifient les contraintes `CHECK`, triggers et policies RLS posés par les
migrations (`supabase/migrations/`) — contre un **Postgres local ordinaire**,
sans dépendre d'un projet Supabase de DEV (qui n'existe pas encore).

## Prérequis

- Un serveur PostgreSQL local (16 recommandé, cohérent avec Supabase),
  démarré et accessible.
- `psql` disponible.
- Selon l'installation, il faut parfois passer par le rôle système
  `postgres` (authentification "peer") : voir la variable `PSQL` ci-dessous.

## Lancer la suite

```bash
npm run test:db
```

Équivalent à `bash supabase/tests/run.sh`. Si votre Postgres local exige
l'authentification peer via le rôle système `postgres` :

```bash
PSQL="sudo -u postgres psql" bash supabase/tests/run.sh
```

Le script crée une base jetable (`planning_ehpad_test`), applique un stub
minimal du schéma `auth` de Supabase (`_stub_auth.sql` — `auth.users`,
`auth.uid()`, rôles `anon`/`authenticated`/`service_role`), applique dans
l'ordre toutes les migrations de `supabase/migrations/`, puis tous les
fichiers `NN_*.sql` de ce dossier, affiche un résumé et sort en erreur (code
non nul) s'il y a au moins un échec. La base de test est supprimée à la fin,
succès ou échec.

## Structure

- `_stub_auth.sql` — schéma `auth` minimal (pas la migration réelle : ne
  jamais l'appliquer sur un vrai projet Supabase, qui a déjà son propre
  schéma `auth`).
- `_helpers.sql` — mini-framework (`test.ok`, `test.doit_echouer`,
  `test.resume`), sans dépendance à une extension (pgTAP indisponible ici).
- `01_fixtures.sql` — données de base réutilisées par les fichiers suivants.
- `02_contraintes.sql`, `03_triggers.sql`, `04_rls.sql` — assertions par
  thème.

## Écrire un nouveau test

- Condition à vérifier : `select test.ok(condition, 'description');`
- Une instruction qui doit échouer (CHECK, trigger) :
  `select test.doit_echouer($$...sql...$$, 'description');`
- Un test RLS (ce qu'un rôle précis peut/ne peut pas faire) : **ne pas**
  passer par `test.doit_echouer` (SECURITY DEFINER — court-circuite RLS,
  vérifié empiriquement que Postgres interdit de toute façon tout
  changement de rôle depuis l'intérieur d'une fonction SECURITY DEFINER).
  Utiliser `SET ROLE authenticated; SET request.jwt.claim.sub = '<uuid>';`
  au niveau du script, exécuter la requête sensible directement (ou dans un
  bloc `DO $$ ... $$` si un `EXCEPTION WHEN insufficient_privilege` est
  nécessaire), puis `RESET ROLE; RESET request.jwt.claim.sub;` — cf.
  `04_rls.sql` pour des exemples des deux cas (lecture via `\gset`,
  écriture bloquée via bloc `DO`).

Piège déjà rencontré : le trigger de cascade (désactivation d'un EHPAD)
désactive **tous** les comptes de l'EHPAD, pas seulement celui qu'on
regarde — un nettoyage de test incomplet après ce genre d'assertion laisse
des comptes de fixtures désactivés pour les tests suivants, avec un symptôme
qui n'a a priori rien à voir (RLS qui semble bloquer une lecture pourtant
légitime). Toujours réinitialiser l'état complet des fixtures modifiées,
pas seulement la ligne qu'on vient de vérifier.
