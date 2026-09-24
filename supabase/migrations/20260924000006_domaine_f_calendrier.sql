-- Domaine F : Calendrier & jours fériés
-- Cf. modèle de données (artifact MCD/MLD), section F.

create table public.annee_planifiee (
  id uuid primary key default gen_random_uuid(),
  ehpad_id uuid not null references public.ehpad (id) on delete cascade,
  annee smallint not null,
  jour_demarrage date not null,
  unique (ehpad_id, annee)
);

create table public.jour_ferie (
  id uuid primary key default gen_random_uuid(),
  annee_planifiee_id uuid not null references public.annee_planifiee (id) on delete cascade,
  date date not null,
  label text not null,
  type text not null check (type in ('fixe', 'calcule', 'personnalise')),
  actif boolean not null default true
);

create index annee_planifiee_ehpad_id_idx on public.annee_planifiee (ehpad_id);
create index jour_ferie_annee_planifiee_id_idx on public.jour_ferie (annee_planifiee_id);
