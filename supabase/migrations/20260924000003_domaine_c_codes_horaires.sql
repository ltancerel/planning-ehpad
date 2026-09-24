-- Domaine C : Codes horaires
-- Cf. modèle de données (artifact MCD/MLD), section C.

create table public.code_horaire (
  id uuid primary key default gen_random_uuid(),
  ehpad_id uuid not null references public.ehpad (id) on delete cascade,
  code text not null,
  intitule text not null,
  couleur_fond text not null,
  couleur_texte text not null,
  categorie text not null check (categorie in ('travail', 'informatif', 'evenementiel')),
  commentaire text,
  afficher_vue_annuelle boolean not null default false,
  action text,
  type_evenement text check (type_evenement in ('special', 'normal', 'partiel')),
  duree_heures numeric(4, 2),
  unique (ehpad_id, code),
  -- « code_horaire : colonnes optionnelles plutôt que sous-typage » — 4
  -- CHECK garantissant la cohérence categorie / type_evenement / duree_heures.
  check (categorie <> 'evenementiel' or type_evenement is not null),
  check (categorie = 'evenementiel' or type_evenement is null),
  check (type_evenement is distinct from 'special' or duree_heures is null),
  check (type_evenement is distinct from 'normal' or duree_heures is not null)
);

create table public.plage_horaire (
  id uuid primary key default gen_random_uuid(),
  code_horaire_id uuid not null references public.code_horaire (id) on delete cascade,
  ordre smallint not null check (ordre between 1 and 4),
  heure_debut time not null,
  heure_fin time not null
);

create index code_horaire_ehpad_id_idx on public.code_horaire (ehpad_id);
create index plage_horaire_code_horaire_id_idx on public.plage_horaire (code_horaire_id);
