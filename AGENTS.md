<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Tests

Convention actée le 25/09 : chaque changement fonctionnel s'accompagne des
tests correspondants, dans le même commit — pas de développement "et on
teste plus tard".

- **Base de données** (migrations, contraintes, triggers, RLS) : tests
  unitaires SQL dans `supabase/tests/`, exécutés avec
  `npm run test:db`. Fonctionnent contre un Postgres local ordinaire (pas
  besoin d'un projet Supabase de DEV, qui n'existe pas encore — cf.
  `supabase/tests/README.md`). Toute nouvelle contrainte/trigger/policy
  RLS doit avoir son assertion correspondante.
- **Parcours front** (grille Planning, Émargement, Administration…) :
  tests système Playwright dans `e2e/`, exécutés avec `npm run test:e2e`
  (lance le serveur de dev automatiquement). Toute nouvelle fonctionnalité
  ou correction visible à l'écran doit avoir son scénario correspondant,
  plutôt qu'une vérification manuelle jetable.

`npm run test` exécute les deux suites. À faire passer avant de considérer
une fonctionnalité terminée, en plus de `tsc --noEmit` et `eslint` déjà en
usage.

## Base de données (accès PROD)

Convention actée le 25/09 : c'est l'agent qui pilote les accès à la base de
données réelle (Supabase), le client fournit les exigences et vérifie la
conformité de ce qui est livré.

- La **lecture** sur la base de données de PROD (requêtes `select`, y
  compris via `execute_sql`, `list_tables`, `get_advisors`…) est toujours
  autorisée, sans demander à chaque fois — accordé explicitement le 25/09.
  Ne concerne que la lecture : toute écriture reste soumise aux règles
  ci-dessous.
- Les **migrations de schéma** (`supabase/migrations/`) sont pilotées à la
  demande, exclusivement sur la base de données de PROD (seul environnement
  existant pour l'instant — pas de DEV/STAGING, cf. BACKLOG epic #38).
- **Avant d'écrire une migration de schéma** (y compris pour relâcher ou
  modifier une contrainte existante), présenter l'analyse d'impact (ce qui
  change en base, ce que ça change ou non côté Front End, les tests
  concernés) et attendre une validation explicite du client avant d'écrire
  le moindre code ou d'appliquer quoi que ce soit — convention actée le
  29/10, suite à un changement (unicité de `compte.identifiant`) analysé
  puis directement implémenté et appliqué en PROD dans le même tour, sans
  étape de validation de l'analyse.
- **Créer des données** sur la base de données de PROD (au-delà du contenu
  des migrations elles-mêmes — ex. amorçage d'un compte, données de
  référence ajoutées hors migration) n'est **jamais** fait sans accord
  explicite préalable, à chaque fois.
- Une migration n'est **appliquée sur PROD qu'une fois son fichier fusionné
  sur `main`** — jamais depuis une branche de travail non fusionnée.
  Objectif : que `main` reflète à tout instant l'état réel du schéma en
  PROD, sans délai. Appliquer depuis une branche crée une fenêtre où PROD
  est en avance sur `main` — risque de divergence silencieuse si la
  branche est abandonnée, réécrite (rebase, force-push) ou fusionnée
  différemment de prévu avant que quelqu'un ne s'en aperçoive. Ordre à
  suivre : écrire la migration → tester localement → committer → fusionner
  la branche sur `main` (ou au moins ce commit) → appliquer depuis `main` →
  auditer (`get_advisors`).
- **Toute nouvelle table** créée dans le schéma `public` doit recevoir ses
  GRANT explicitement, dans la même migration que son `CREATE TABLE` —
  convention actée le 21/10 suite à l'annonce Supabase : à partir du
  30/10/2026, Supabase arrête d'accorder automatiquement l'accès Data API
  (PostgREST/supabase-js/GraphQL) aux nouvelles tables de `public`. Les
  tables déjà existantes au 21/10 ne sont pas concernées (droits conservés)
  — ce projet les couvre déjà via le GRANT global de
  `20260924000008_rls.sql` (`grant select, insert, update, delete on all
  tables in schema public to authenticated`), qui ne s'applique qu'aux
  tables déjà créées au moment où il s'exécute. Toute table future doit
  donc porter, dans son propre fichier de migration :
  ```sql
  grant select, insert, update, delete on public.ma_table to authenticated;
  grant select, insert, update, delete on public.ma_table to service_role;
  -- grant select on public.ma_table to anon;  -- seulement si une lecture publique est voulue
  ```
  (la RLS reste la vraie barrière de sécurité ; ce GRANT est un
  prérequis Postgres de base sans lequel la RLS ne s'applique même pas.)
- **Toute migration appliquée sur PROD qui change le schéma** (table,
  colonne, contrainte ajoutée/supprimée/modifiée) s'accompagne d'une mise à
  jour du
  [Modèle de données](https://claude.ai/artifact/3sR99FsK3pjzNivG7NB8FV)
  (MCD/MLD) — convention actée le 29/10, suite à un oubli constaté sur la
  migration `type_paie` (remplacement de la table `contrat`, document resté
  en l'état). Document de référence pour le modèle de données réel, pas
  seulement de conception initiale (issue #25) : à tenir à jour en continu,
  dans le même tour que la migration elle-même (schéma, note de conception
  concernée, nombre d'entités dans l'en-tête si une table apparaît/disparaît).
