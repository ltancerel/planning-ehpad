#!/usr/bin/env bash
# Suite de tests unitaires base de données — cf. supabase/tests/README.md.
# Crée une base jetable, applique le schéma (migrations) puis les tests,
# affiche un résumé, et sort en erreur si un test a échoué.

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$DIR/../migrations"
DB_NAME="planning_ehpad_test"

# PSQL : commande à utiliser pour se connecter en tant que superutilisateur
# Postgres. Sur cet environnement (peer auth), il faut passer par le rôle
# système "postgres" : PSQL="sudo -u postgres psql" ./supabase/tests/run.sh
PSQL="${PSQL:-psql}"

if ! pg_isready -q 2>/dev/null; then
  echo "Postgres local non démarré (pg_ctlcluster <version> main start, ou équivalent)." >&2
  exit 1
fi

echo "== Base de test : $DB_NAME =="
$PSQL -X -v ON_ERROR_STOP=1 -c "drop database if exists $DB_NAME;" -c "create database $DB_NAME;" postgres

echo "== Stub schéma auth =="
$PSQL -X -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$DIR/_stub_auth.sql"

echo "== Migrations =="
for f in "$MIGRATIONS_DIR"/*.sql; do
  echo "  -> $(basename "$f")"
  $PSQL -X -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$f"
done

echo "== Framework de tests =="
$PSQL -X -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$DIR/_helpers.sql"

echo "== Tests =="
echec=0
for f in "$DIR"/[0-9][0-9]_*.sql; do
  echo "  -> $(basename "$f")"
  if ! $PSQL -X -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$f"; then
    echec=1
  fi
done

echo "== Résumé =="
if ! $PSQL -X -d "$DB_NAME" -c "select test.resume();"; then
  echec=1
fi

echo "== Nettoyage =="
$PSQL -X -c "drop database if exists $DB_NAME;" postgres

exit $echec
