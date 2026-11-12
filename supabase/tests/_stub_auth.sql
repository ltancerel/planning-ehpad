-- Stub minimal du schéma auth de Supabase, pour exécuter les migrations et
-- les tests contre un Postgres local ordinaire, sans le stack Supabase
-- complet (pas de projet de DEV pour l'instant — cf. supabase/tests/README.md).
-- Reproduit uniquement ce dont les migrations dépendent : auth.users (PK
-- référencée par administrateur_systeme/compte), auth.uid(), et les rôles
-- standards anon/authenticated/service_role utilisés par les GRANT/RLS.

create schema if not exists auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

-- Sur Supabase, auth.uid() lit le JWT de la requête en cours. En local, on
-- simule via une variable de session réglable avec set_config (utilisée par
-- les tests RLS), par défaut NULL (visiteur non authentifié).
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin nosuperuser nobypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin nosuperuser nobypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin nosuperuser bypassrls;
  end if;
end $$;

-- Sur un vrai projet Supabase, le schéma auth accorde par défaut USAGE (et
-- EXECUTE sur ses fonctions) à anon/authenticated/service_role — sans quoi
-- aucune fonction SECURITY INVOKER ne pourrait jamais lire auth.uid()
-- directement (seules les fonctions SECURITY DEFINER le pouvaient jusqu'ici
-- dans ce projet, via auth_ehpad_id() et consorts). Reproduit ici pour ne
-- pas laisser le stub local plus restrictif que la réalité.
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
