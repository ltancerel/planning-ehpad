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
