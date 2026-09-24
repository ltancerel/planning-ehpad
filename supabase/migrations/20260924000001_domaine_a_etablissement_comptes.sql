-- Domaine A : Établissement, comptes & applications
-- Cf. modèle de données (artifact MCD/MLD), section A.

create table public.ehpad (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  logo_base64 text,
  actif boolean not null default true
);

create table public.application (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  nom text not null
);

-- id = identifiant Supabase Auth (auth.users.id), jamais généré côté base :
-- la ligne est insérée après création de l'utilisateur Supabase Auth.
create table public.administrateur_systeme (
  id uuid primary key references auth.users (id) on delete cascade,
  nom text not null,
  prenom text not null,
  identifiant text not null unique,
  email text not null unique,
  actif boolean not null default true
);

create table public.service (
  id uuid primary key default gen_random_uuid(),
  ehpad_id uuid not null references public.ehpad (id) on delete cascade,
  nom text not null,
  ordre int not null
);

-- id = identifiant Supabase Auth (auth.users.id), même principe que
-- administrateur_systeme.
create table public.compte (
  id uuid primary key references auth.users (id) on delete cascade,
  ehpad_id uuid not null references public.ehpad (id) on delete cascade,
  type_compte text not null check (type_compte in ('administrateur', 'manager', 'utilisateur')),
  nom text not null,
  prenom text not null,
  identifiant text not null unique,
  email text not null unique,
  service_id uuid references public.service (id) on delete set null,
  poste text,
  actif boolean not null default true
);

create table public.ehpad_application (
  ehpad_id uuid not null references public.ehpad (id) on delete cascade,
  application_id uuid not null references public.application (id) on delete cascade,
  primary key (ehpad_id, application_id)
);

create table public.compte_application (
  compte_id uuid not null references public.compte (id) on delete cascade,
  application_id uuid not null references public.application (id) on delete cascade,
  primary key (compte_id, application_id)
);

-- Colonnes utilisées dans les policies RLS (domaine A et scoping indirect
-- par les domaines suivants) : indexées dès la création, cf. story #32.
create index service_ehpad_id_idx on public.service (ehpad_id);
create index compte_ehpad_id_idx on public.compte (ehpad_id);
create index compte_service_id_idx on public.compte (service_id);
create index ehpad_application_application_id_idx on public.ehpad_application (application_id);
create index compte_application_application_id_idx on public.compte_application (application_id);

-- « identifiant : unique tous comptes confondus, garanti par trigger » —
-- compte.identifiant et administrateur_systeme.identifiant sont chacun
-- UNIQUE dans leur propre table, ce qui n'empêche pas le même identifiant
-- d'exister dans les deux tables à la fois. La connexion se faisant par
-- identifiant (résolu en email côté serveur), cette résolution doit être
-- non-ambiguë.
create or replace function public.verifier_identifiant_unique_global()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if TG_TABLE_NAME = 'compte' then
    if exists (select 1 from public.administrateur_systeme where identifiant = NEW.identifiant) then
      raise exception 'identifiant "%" déjà utilisé par un administrateur système', NEW.identifiant;
    end if;
  else
    if exists (select 1 from public.compte where identifiant = NEW.identifiant) then
      raise exception 'identifiant "%" déjà utilisé par un compte', NEW.identifiant;
    end if;
  end if;
  return NEW;
end;
$$;

create trigger verifier_identifiant_unique_compte
before insert or update of identifiant on public.compte
for each row execute function public.verifier_identifiant_unique_global();

create trigger verifier_identifiant_unique_administrateur_systeme
before insert or update of identifiant on public.administrateur_systeme
for each row execute function public.verifier_identifiant_unique_global();

-- « Désactivation d'un EHPAD : cascade sur ses comptes » — ehpad.actif à
-- false force actif = false sur tous les comptes de cet EHPAD.
create or replace function public.desactiver_comptes_ehpad()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if NEW.actif = false and OLD.actif = true then
    update public.compte set actif = false where ehpad_id = NEW.id and actif = true;
  end if;
  return NEW;
end;
$$;

create trigger cascade_desactivation_ehpad
after update of actif on public.ehpad
for each row execute function public.desactiver_comptes_ehpad();

-- « ehpad_application vs compte_application » — compte_application doit
-- rester un sous-ensemble de ehpad_application pour l'EHPAD du compte
-- concerné.
create or replace function public.verifier_application_souscrite()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  ehpad_du_compte uuid;
begin
  select ehpad_id into ehpad_du_compte from public.compte where id = NEW.compte_id;
  if not exists (
    select 1 from public.ehpad_application
    where ehpad_id = ehpad_du_compte and application_id = NEW.application_id
  ) then
    raise exception 'application non souscrite par l''EHPAD de ce compte';
  end if;
  return NEW;
end;
$$;

create trigger verifier_application_souscrite_compte
before insert or update on public.compte_application
for each row execute function public.verifier_application_souscrite();
