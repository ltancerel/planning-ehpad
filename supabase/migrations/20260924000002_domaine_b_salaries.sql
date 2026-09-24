-- Domaine B : Salariés & organisation
-- Cf. modèle de données (artifact MCD/MLD), section B.

create table public.salarie (
  id uuid primary key default gen_random_uuid(),
  ehpad_id uuid not null references public.ehpad (id) on delete cascade,
  service_id uuid not null references public.service (id) on delete restrict,
  matricule text not null,
  nom text not null,
  prenom text not null,
  manager text,
  alignement_roulement text,
  presence text not null check (presence in ('Présent', 'Absent')),
  unique (ehpad_id, matricule)
);

create table public.contrat (
  id uuid primary key default gen_random_uuid(),
  salarie_id uuid not null references public.salarie (id) on delete cascade,
  type_contrat text not null check (type_contrat in ('CDD', 'CDI')),
  date_debut date not null,
  date_fin date,
  actif boolean not null default true
);

create index salarie_ehpad_id_idx on public.salarie (ehpad_id);
create index salarie_service_id_idx on public.salarie (service_id);
create index contrat_salarie_id_idx on public.contrat (salarie_id);

-- « contrat : un seul actif par salarié, via index unique partiel » — un
-- CHECK ne peut pas porter sur plusieurs lignes.
create unique index un_seul_contrat_actif_par_salarie on public.contrat (salarie_id) where actif = true;
