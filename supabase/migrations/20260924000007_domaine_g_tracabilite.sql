-- Domaine G : Traçabilité (historique & audit)
-- Cf. modèle de données (artifact MCD/MLD), section G.

create table public.journee_historique (
  id uuid primary key default gen_random_uuid(),
  salarie_id uuid not null references public.salarie (id) on delete cascade,
  date date not null,
  code_travail_id uuid references public.code_horaire (id) on delete restrict,
  code_evenementiel_id uuid references public.code_horaire (id) on delete restrict,
  evenementiel_plage_debut time,
  evenementiel_plage_fin time,
  type_operation text not null check (type_operation in ('creation', 'modification', 'effacement', 'application_roulement')),
  compte_id_auteur uuid references auth.users (id) on delete set null,
  horodatage timestamptz not null default now()
);

create table public.log_audit (
  id uuid primary key default gen_random_uuid(),
  horodatage timestamptz not null default now(),
  ehpad_id uuid references public.ehpad (id) on delete set null,
  compte_id_auteur uuid references auth.users (id) on delete set null,
  acteur_type text not null check (acteur_type in ('administrateur_systeme', 'administrateur', 'manager', 'utilisateur', 'service')),
  acteur_nom text not null,
  niveau text not null default 'info' check (niveau in ('info', 'avertissement', 'erreur')),
  statut text not null default 'succes' check (statut in ('succes', 'echec')),
  type_operation text not null,
  event_id text,
  entite text not null,
  entite_id uuid,
  source text not null,
  ip_source inet,
  ip_destination inet,
  port_source integer,
  port_destination integer,
  hostname text,
  message text not null,
  detail jsonb
);

create index journee_historique_salarie_id_idx on public.journee_historique (salarie_id);
create index log_audit_ehpad_id_idx on public.log_audit (ehpad_id);
create index log_audit_horodatage_idx on public.log_audit (horodatage desc);
create index log_audit_entite_idx on public.log_audit (entite, entite_id);

-- « journee vs. journee_historique » — trigger dédié, recopie l'état de
-- journee à chaque changement. type_operation par défaut déduit de TG_OP,
-- mais une fonction RPC (ex. appliquer_roulement, à venir) peut le
-- surcharger via un paramètre de session limité à sa transaction, lu ici
-- en priorité (cf. note « Traçabilité des fonctions RPC »).
create or replace function public.tracer_journee_historique()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  op text;
begin
  op := nullif(current_setting('app.type_operation', true), '');
  if op is null then
    op := case TG_OP
      when 'INSERT' then 'creation'
      when 'UPDATE' then 'modification'
      when 'DELETE' then 'effacement'
    end;
  end if;

  insert into public.journee_historique (
    salarie_id, date, code_travail_id, code_evenementiel_id, type_operation, compte_id_auteur
  )
  values (
    coalesce(NEW.salarie_id, OLD.salarie_id),
    coalesce(NEW.date, OLD.date),
    case when TG_OP = 'DELETE' then OLD.code_travail_id else NEW.code_travail_id end,
    case when TG_OP = 'DELETE' then OLD.code_evenementiel_id else NEW.code_evenementiel_id end,
    op,
    auth.uid()
  );

  return coalesce(NEW, OLD);
end;
$$;

create trigger tracer_journee
after insert or update or delete on public.journee
for each row execute function public.tracer_journee_historique();

-- « Traçabilité garantie par triggers génériques » — fonction générique
-- réutilisable attachée à chaque table auditée de la liste ci-dessous.
-- acteur_type/acteur_nom sont dénormalisés depuis compte ou
-- administrateur_systeme (le compte peut être supprimé par la suite sans
-- perdre la lisibilité du journal) ; 'service' couvre une écriture sans
-- auth.uid() (seed, script serveur).
create or replace function public.tracer_log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ligne jsonb := to_jsonb(coalesce(NEW, OLD));
  ehpad_ref uuid;
  acteur_type_val text;
  acteur_nom_val text;
begin
  if ligne ? 'ehpad_id' then
    ehpad_ref := (ligne ->> 'ehpad_id')::uuid;
  end if;

  select type_compte, (nom || ' ' || prenom) into acteur_type_val, acteur_nom_val
  from public.compte where id = auth.uid();

  if not found then
    select 'administrateur_systeme', (nom || ' ' || prenom) into acteur_type_val, acteur_nom_val
    from public.administrateur_systeme where id = auth.uid();
  end if;

  if not found then
    acteur_type_val := 'service';
    acteur_nom_val := 'service';
  end if;

  insert into public.log_audit (
    ehpad_id, compte_id_auteur, acteur_type, acteur_nom, type_operation, entite, entite_id, source, message
  )
  values (
    ehpad_ref,
    auth.uid(),
    acteur_type_val,
    acteur_nom_val,
    case TG_OP
      when 'INSERT' then 'creation'
      when 'UPDATE' then 'modification'
      when 'DELETE' then 'effacement'
    end,
    TG_TABLE_NAME,
    (ligne ->> 'id')::uuid,
    'Planning',
    format('%s sur %s', TG_OP, TG_TABLE_NAME)
  );

  return coalesce(NEW, OLD);
end;
$$;

-- journee est volontairement exclue : elle a déjà sa propre historisation
-- dédiée et plus détaillée (journee_historique) — cf. note « Traçabilité
-- garantie par triggers génériques, pas par le code applicatif ».
do $$
declare
  t text;
  tables_auditees text[] := array[
    'ehpad', 'service', 'compte', 'administrateur_systeme', 'application',
    'ehpad_application', 'compte_application', 'salarie', 'contrat',
    'code_horaire', 'plage_horaire', 'roulement', 'roulement_jour',
    'affectation_roulement', 'annee_planifiee', 'jour_ferie', 'validation_emargement'
  ];
begin
  foreach t in array tables_auditees loop
    execute format(
      'create trigger tracer_log_audit after insert or update or delete on public.%I for each row execute function public.tracer_log_audit()',
      t
    );
  end loop;
end $$;
