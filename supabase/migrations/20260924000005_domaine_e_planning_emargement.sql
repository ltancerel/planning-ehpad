-- Domaine E : Planning & émargement
-- Cf. modèle de données (artifact MCD/MLD), section E.

create table public.journee (
  id uuid primary key default gen_random_uuid(),
  salarie_id uuid not null references public.salarie (id) on delete cascade,
  date date not null,
  code_travail_id uuid references public.code_horaire (id) on delete restrict,
  code_informatif_id uuid references public.code_horaire (id) on delete restrict,
  code_evenementiel_id uuid references public.code_horaire (id) on delete restrict,
  unique (salarie_id, date),
  -- « journee : composition d'une case, garantie par CHECK »
  check (code_evenementiel_id is null or code_travail_id is not null),
  check (not (code_travail_id is not null and code_evenementiel_id is not null and code_informatif_id is not null))
);

create table public.journee_evenementiel_plage (
  id uuid primary key default gen_random_uuid(),
  journee_id uuid not null references public.journee (id) on delete cascade,
  ordre smallint not null,
  heure_debut time not null,
  heure_fin time not null
);

create table public.validation_emargement (
  id uuid primary key default gen_random_uuid(),
  salarie_id uuid not null references public.salarie (id) on delete cascade,
  annee smallint not null,
  mois smallint not null check (mois between 1 and 12),
  date_validation timestamptz not null default now(),
  unique (salarie_id, annee, mois)
);

create index journee_salarie_id_idx on public.journee (salarie_id);
create index journee_code_travail_id_idx on public.journee (code_travail_id);
create index journee_code_informatif_id_idx on public.journee (code_informatif_id);
create index journee_code_evenementiel_id_idx on public.journee (code_evenementiel_id);
create index journee_evenementiel_plage_journee_id_idx on public.journee_evenementiel_plage (journee_id);
create index validation_emargement_salarie_id_idx on public.validation_emargement (salarie_id);

-- Réutilise la fonction générique de vérification de catégorie posée dans
-- le domaine D (une par colonne, chacune contrainte à sa propre catégorie).
create trigger verifier_categorie_journee_travail
before insert or update of code_travail_id on public.journee
for each row execute function public.verifier_categorie_code_horaire('code_travail_id', 'travail');

create trigger verifier_categorie_journee_informatif
before insert or update of code_informatif_id on public.journee
for each row execute function public.verifier_categorie_code_horaire('code_informatif_id', 'informatif');

create trigger verifier_categorie_journee_evenementiel
before insert or update of code_evenementiel_id on public.journee
for each row execute function public.verifier_categorie_code_horaire('code_evenementiel_id', 'evenementiel');
