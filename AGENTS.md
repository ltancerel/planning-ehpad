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

- Les **migrations de schéma** (`supabase/migrations/`) sont pilotées à la
  demande, exclusivement sur la base de données de PROD (seul environnement
  existant pour l'instant — pas de DEV/STAGING, cf. BACKLOG epic #38).
- **Créer des données** sur la base de données de PROD (au-delà du contenu
  des migrations elles-mêmes — ex. amorçage d'un compte, données de
  référence ajoutées hors migration) n'est **jamais** fait sans accord
  explicite préalable, à chaque fois.
