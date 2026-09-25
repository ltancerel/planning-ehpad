-- Mini-framework de tests unitaires SQL, sans dépendance à une extension
-- (pgTAP n'est pas disponible dans cet environnement, cf.
-- supabase/tests/README.md) — juste assez pour des assertions claires,
-- un résumé, et un code de sortie non nul en cas d'échec.

create schema if not exists test;

create table test._resultats (
  id serial primary key,
  nom text not null,
  reussi boolean not null,
  detail text
);

-- Assertion générique : condition doit être vraie. SECURITY DEFINER :
-- appelée depuis des blocs exécutés comme authenticated (tests RLS, cf.
-- 04_rls.sql), qui n'a par ailleurs aucun droit sur test._resultats.
create or replace function test.ok(condition boolean, nom text, detail text default null)
returns void language plpgsql security definer as $$
begin
  insert into test._resultats (nom, reussi, detail) values (nom, coalesce(condition, false), detail);
  if coalesce(condition, false) then
    raise notice 'OK   %', nom;
  else
    raise warning 'ECHEC %  (%)', nom, coalesce(detail, 'condition fausse');
  end if;
end;
$$;

-- Vérifie qu'une instruction SQL (texte) lève bien une erreur — pour les
-- CHECK/triggers censés rejeter un cas invalide. N'aborte pas la
-- transaction en cours : le bloc PL/pgSQL agit comme un savepoint implicite.
--
-- SECURITY DEFINER uniquement pour pouvoir appeler test.ok() ci-dessus ;
-- le sql passé en paramètre s'exécute donc TOUJOURS avec les privilèges du
-- propriétaire de cette fonction (Postgres interdit tout changement de
-- rôle depuis l'intérieur d'une fonction SECURITY DEFINER, vérifié
-- empiriquement) — inadapté pour un test qui doit vérifier ce qu'un rôle
-- précis (authenticated + un JWT donné) peut ou ne peut pas faire sous
-- RLS. Pour ce cas-là, cf. le motif SET ROLE + DO block direct dans
-- 04_rls.sql plutôt que cette fonction.
create or replace function test.doit_echouer(sql text, nom text)
returns void language plpgsql security definer as $$
begin
  begin
    execute sql;
    perform test.ok(false, nom, 'aucune erreur levée');
  exception when others then
    perform test.ok(true, nom, SQLERRM);
  end;
end;
$$;

-- À appeler en toute fin de suite : affiche le résumé et lève une erreur
-- (donc un code de sortie non nul pour psql) s'il y a au moins un échec.
create or replace function test.resume()
returns void language plpgsql as $$
declare
  total int;
  echecs int;
begin
  select count(*), count(*) filter (where not reussi) into total, echecs from test._resultats;
  raise notice '--- % test(s), % echec(s) ---', total, echecs;
  if echecs > 0 then
    raise exception '% test(s) en echec sur %', echecs, total;
  end if;
end;
$$;

-- Les tests RLS (04_rls.sql) appellent test.ok() depuis un bloc exécuté
-- comme authenticated (SET ROLE, hors fonction — cf. ce fichier) : accès
-- nécessaire au schéma et aux fonctions, indépendamment de leur statut
-- SECURITY DEFINER.
grant usage on schema test to authenticated, anon;
grant execute on all functions in schema test to authenticated, anon;
