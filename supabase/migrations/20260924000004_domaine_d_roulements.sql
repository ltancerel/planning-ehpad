-- Domaine D : Roulements
-- Cf. modèle de données (artifact MCD/MLD), section D.

create table public.roulement (
  id uuid primary key default gen_random_uuid(),
  ehpad_id uuid not null references public.ehpad (id) on delete cascade,
  nom text not null,
  nb_semaines smallint not null check (nb_semaines > 0)
);

create table public.roulement_jour (
  id uuid primary key default gen_random_uuid(),
  roulement_id uuid not null references public.roulement (id) on delete cascade,
  semaine_index smallint not null,
  jour_semaine smallint not null check (jour_semaine between 0 and 6),
  code_horaire_id uuid references public.code_horaire (id) on delete restrict
);

create table public.affectation_roulement (
  id uuid primary key default gen_random_uuid(),
  salarie_id uuid not null references public.salarie (id) on delete cascade,
  roulement_id uuid not null references public.roulement (id) on delete restrict,
  date_debut date not null,
  date_fin date
);

create index roulement_ehpad_id_idx on public.roulement (ehpad_id);
create index roulement_jour_roulement_id_idx on public.roulement_jour (roulement_id);
create index roulement_jour_code_horaire_id_idx on public.roulement_jour (code_horaire_id);
create index affectation_roulement_salarie_id_idx on public.affectation_roulement (salarie_id);
create index affectation_roulement_roulement_id_idx on public.affectation_roulement (roulement_id);

-- « Cohérence catégorie ↔ code horaire référencé, garantie par trigger » —
-- fonction générique réutilisée par les domaines D et E : vérifie que la
-- colonne FK désignée par TG_ARGV[0] référence un code_horaire de la
-- catégorie TG_ARGV[1]. Un CHECK ne peut pas vérifier une colonne d'une
-- autre table, d'où le trigger.
create or replace function public.verifier_categorie_code_horaire()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  colonne text := TG_ARGV[0];
  categorie_attendue text := TG_ARGV[1];
  code_id uuid;
  categorie_reelle text;
begin
  code_id := (to_jsonb(NEW) ->> colonne)::uuid;
  if code_id is null then
    return NEW;
  end if;
  select categorie into categorie_reelle from public.code_horaire where id = code_id;
  if categorie_reelle is distinct from categorie_attendue then
    raise exception '% doit référencer un code_horaire de catégorie %, trouvé %', colonne, categorie_attendue, categorie_reelle;
  end if;
  return NEW;
end;
$$;

create trigger verifier_categorie_roulement_jour
before insert or update of code_horaire_id on public.roulement_jour
for each row execute function public.verifier_categorie_code_horaire('code_horaire_id', 'travail');
