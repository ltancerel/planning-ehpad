-- Row Level Security — cf. note « type_compte : 3 niveaux de droits » et
-- « Multi-établissement » du modèle de données. Seules les règles posées
-- en base constituent une garantie réelle (API PostgREST directement
-- accessible) : c'est le principe directeur de tout ce fichier.
--
-- Niveaux : administrateur_systeme (transverse, tous établissements) ;
-- administrateur (tout son EHPAD) ; manager (planning/émargement de son
-- EHPAD uniquement, lecture seule sur la configuration) ; utilisateur
-- (lecture seule sur tout son EHPAD).

-- ---------------------------------------------------------------------
-- Fonctions utilitaires (security definer : évite toute récursion RLS en
-- lisant compte/administrateur_systeme, elles-mêmes sous RLS).
-- ---------------------------------------------------------------------

create or replace function public.est_administrateur_systeme()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.administrateur_systeme where id = auth.uid() and actif
  );
$$;

create or replace function public.auth_ehpad_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select ehpad_id from public.compte where id = auth.uid() and actif;
$$;

create or replace function public.auth_type_compte()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select type_compte from public.compte where id = auth.uid() and actif;
$$;

-- ---------------------------------------------------------------------
-- administrateur_systeme — visible et gérable seulement par lui-même
-- ---------------------------------------------------------------------

alter table public.administrateur_systeme enable row level security;

create policy "lecture par administrateur systeme" on public.administrateur_systeme
  for select using (public.est_administrateur_systeme());

create policy "ecriture par administrateur systeme" on public.administrateur_systeme
  for insert with check (public.est_administrateur_systeme());

create policy "modification par administrateur systeme" on public.administrateur_systeme
  for update using (public.est_administrateur_systeme()) with check (public.est_administrateur_systeme());

create policy "suppression par administrateur systeme" on public.administrateur_systeme
  for delete using (public.est_administrateur_systeme());

-- ---------------------------------------------------------------------
-- ehpad — lecture par tout compte de l'établissement ou l'administrateur
-- système ; écriture réservée à l'administrateur système (« seul
-- l'Administrateur Système peut créer/gérer un EHPAD »)
-- ---------------------------------------------------------------------

alter table public.ehpad enable row level security;

create policy "lecture ehpad" on public.ehpad
  for select using (public.est_administrateur_systeme() or id = public.auth_ehpad_id());

create policy "ecriture ehpad par administrateur systeme" on public.ehpad
  for insert with check (public.est_administrateur_systeme());

create policy "modification ehpad par administrateur systeme" on public.ehpad
  for update using (public.est_administrateur_systeme()) with check (public.est_administrateur_systeme());

create policy "suppression ehpad par administrateur systeme" on public.ehpad
  for delete using (public.est_administrateur_systeme());

-- ---------------------------------------------------------------------
-- application — catalogue global, lecture pour tout compte connecté,
-- écriture réservée à l'administrateur système
-- ---------------------------------------------------------------------

alter table public.application enable row level security;

create policy "lecture application" on public.application
  for select using (auth.uid() is not null);

create policy "ecriture application par administrateur systeme" on public.application
  for insert with check (public.est_administrateur_systeme());

create policy "modification application par administrateur systeme" on public.application
  for update using (public.est_administrateur_systeme()) with check (public.est_administrateur_systeme());

create policy "suppression application par administrateur systeme" on public.application
  for delete using (public.est_administrateur_systeme());

-- ---------------------------------------------------------------------
-- ehpad_application — lecture scopée à son EHPAD, écriture réservée à
-- l'administrateur système (plafond d'applications souscrites)
-- ---------------------------------------------------------------------

alter table public.ehpad_application enable row level security;

create policy "lecture ehpad_application" on public.ehpad_application
  for select using (public.est_administrateur_systeme() or ehpad_id = public.auth_ehpad_id());

create policy "ecriture ehpad_application par administrateur systeme" on public.ehpad_application
  for all using (public.est_administrateur_systeme()) with check (public.est_administrateur_systeme());

-- ---------------------------------------------------------------------
-- Tables scopées directement par ehpad_id : lecture par tout compte actif
-- de l'établissement, écriture réservée à l'administrateur de cet
-- établissement (ou l'administrateur système, tous établissements).
-- ---------------------------------------------------------------------

do $$
declare
  t text;
  tables_ehpad_admin text[] := array[
    'service', 'compte', 'salarie', 'code_horaire', 'roulement', 'annee_planifiee'
  ];
begin
  foreach t in array tables_ehpad_admin loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy "lecture %1$s" on public.%1$s for select using (public.est_administrateur_systeme() or ehpad_id = public.auth_ehpad_id())',
      t
    );
    execute format(
      'create policy "ecriture %1$s" on public.%1$s for insert with check (public.est_administrateur_systeme() or (public.auth_type_compte() = ''administrateur'' and ehpad_id = public.auth_ehpad_id()))',
      t
    );
    execute format(
      'create policy "modification %1$s" on public.%1$s for update using (public.est_administrateur_systeme() or (public.auth_type_compte() = ''administrateur'' and ehpad_id = public.auth_ehpad_id())) with check (public.est_administrateur_systeme() or (public.auth_type_compte() = ''administrateur'' and ehpad_id = public.auth_ehpad_id()))',
      t
    );
    execute format(
      'create policy "suppression %1$s" on public.%1$s for delete using (public.est_administrateur_systeme() or (public.auth_type_compte() = ''administrateur'' and ehpad_id = public.auth_ehpad_id()))',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Tables scopées via une table parente (pas de ehpad_id direct) : même
-- principe, ehpad_id résolu par sous-requête sur la table parente.
-- ---------------------------------------------------------------------

-- plage_horaire (via code_horaire)
alter table public.plage_horaire enable row level security;

create policy "lecture plage_horaire" on public.plage_horaire
  for select using (
    public.est_administrateur_systeme()
    or exists (select 1 from public.code_horaire c where c.id = code_horaire_id and c.ehpad_id = public.auth_ehpad_id())
  );

create policy "ecriture plage_horaire" on public.plage_horaire
  for all using (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() = 'administrateur'
        and exists (select 1 from public.code_horaire c where c.id = code_horaire_id and c.ehpad_id = public.auth_ehpad_id()))
  )
  with check (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() = 'administrateur'
        and exists (select 1 from public.code_horaire c where c.id = code_horaire_id and c.ehpad_id = public.auth_ehpad_id()))
  );

-- roulement_jour (via roulement)
alter table public.roulement_jour enable row level security;

create policy "lecture roulement_jour" on public.roulement_jour
  for select using (
    public.est_administrateur_systeme()
    or exists (select 1 from public.roulement r where r.id = roulement_id and r.ehpad_id = public.auth_ehpad_id())
  );

create policy "ecriture roulement_jour" on public.roulement_jour
  for all using (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() = 'administrateur'
        and exists (select 1 from public.roulement r where r.id = roulement_id and r.ehpad_id = public.auth_ehpad_id()))
  )
  with check (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() = 'administrateur'
        and exists (select 1 from public.roulement r where r.id = roulement_id and r.ehpad_id = public.auth_ehpad_id()))
  );

-- affectation_roulement (via salarie)
alter table public.affectation_roulement enable row level security;

create policy "lecture affectation_roulement" on public.affectation_roulement
  for select using (
    public.est_administrateur_systeme()
    or exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = public.auth_ehpad_id())
  );

create policy "ecriture affectation_roulement" on public.affectation_roulement
  for all using (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() = 'administrateur'
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = public.auth_ehpad_id()))
  )
  with check (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() = 'administrateur'
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = public.auth_ehpad_id()))
  );

-- contrat (via salarie)
alter table public.contrat enable row level security;

create policy "lecture contrat" on public.contrat
  for select using (
    public.est_administrateur_systeme()
    or exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = public.auth_ehpad_id())
  );

create policy "ecriture contrat" on public.contrat
  for insert with check (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() = 'administrateur'
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = public.auth_ehpad_id()))
  );

create policy "modification contrat" on public.contrat
  for update using (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() = 'administrateur'
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = public.auth_ehpad_id()))
  )
  with check (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() = 'administrateur'
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = public.auth_ehpad_id()))
  );

-- « DELETE exceptionnel sur contrat réservé à l'Administrateur Système »
create policy "suppression contrat par administrateur systeme" on public.contrat
  for delete using (public.est_administrateur_systeme());

-- jour_ferie (via annee_planifiee)
alter table public.jour_ferie enable row level security;

create policy "lecture jour_ferie" on public.jour_ferie
  for select using (
    public.est_administrateur_systeme()
    or exists (select 1 from public.annee_planifiee a where a.id = annee_planifiee_id and a.ehpad_id = public.auth_ehpad_id())
  );

create policy "ecriture jour_ferie" on public.jour_ferie
  for all using (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() = 'administrateur'
        and exists (select 1 from public.annee_planifiee a where a.id = annee_planifiee_id and a.ehpad_id = public.auth_ehpad_id()))
  )
  with check (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() = 'administrateur'
        and exists (select 1 from public.annee_planifiee a where a.id = annee_planifiee_id and a.ehpad_id = public.auth_ehpad_id()))
  );

-- compte_application (via compte)
alter table public.compte_application enable row level security;

create policy "lecture compte_application" on public.compte_application
  for select using (
    public.est_administrateur_systeme()
    or exists (select 1 from public.compte c where c.id = compte_id and c.ehpad_id = public.auth_ehpad_id())
  );

create policy "ecriture compte_application" on public.compte_application
  for all using (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() = 'administrateur'
        and exists (select 1 from public.compte c where c.id = compte_id and c.ehpad_id = public.auth_ehpad_id()))
  )
  with check (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() = 'administrateur'
        and exists (select 1 from public.compte c where c.id = compte_id and c.ehpad_id = public.auth_ehpad_id()))
  );

-- ---------------------------------------------------------------------
-- journee / journee_evenementiel_plage — lecture par tout compte de
-- l'EHPAD, écriture par administrateur ET manager (le manager peut
-- modifier le planning, cf. note « type_compte »).
-- ---------------------------------------------------------------------

alter table public.journee enable row level security;

create policy "lecture journee" on public.journee
  for select using (
    public.est_administrateur_systeme()
    or exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = public.auth_ehpad_id())
  );

create policy "ecriture journee" on public.journee
  for all using (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() in ('administrateur', 'manager')
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = public.auth_ehpad_id()))
  )
  with check (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() in ('administrateur', 'manager')
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = public.auth_ehpad_id()))
  );

alter table public.journee_evenementiel_plage enable row level security;

create policy "lecture journee_evenementiel_plage" on public.journee_evenementiel_plage
  for select using (
    public.est_administrateur_systeme()
    or exists (
      select 1 from public.journee j
      join public.salarie s on s.id = j.salarie_id
      where j.id = journee_id and s.ehpad_id = public.auth_ehpad_id()
    )
  );

create policy "ecriture journee_evenementiel_plage" on public.journee_evenementiel_plage
  for all using (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() in ('administrateur', 'manager')
        and exists (
          select 1 from public.journee j
          join public.salarie s on s.id = j.salarie_id
          where j.id = journee_id and s.ehpad_id = public.auth_ehpad_id()
        ))
  )
  with check (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() in ('administrateur', 'manager')
        and exists (
          select 1 from public.journee j
          join public.salarie s on s.id = j.salarie_id
          where j.id = journee_id and s.ehpad_id = public.auth_ehpad_id()
        ))
  );

-- validation_emargement (via salarie) — même principe que journee. Qui a
-- réellement le droit de valider (le salarié n'a pas de compte) reste un
-- point ouvert non tranché par la maquette ; administrateur/manager de
-- l'EHPAD en attendant.
alter table public.validation_emargement enable row level security;

create policy "lecture validation_emargement" on public.validation_emargement
  for select using (
    public.est_administrateur_systeme()
    or exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = public.auth_ehpad_id())
  );

create policy "ecriture validation_emargement" on public.validation_emargement
  for all using (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() in ('administrateur', 'manager')
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = public.auth_ehpad_id()))
  )
  with check (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() in ('administrateur', 'manager')
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = public.auth_ehpad_id()))
  );

-- ---------------------------------------------------------------------
-- journee_historique / log_audit — lecture seule pour les rôles clients
-- (aucune policy d'écriture : seuls les triggers SECURITY DEFINER, qui
-- contournent RLS, y écrivent — cf. domaine G).
-- ---------------------------------------------------------------------

alter table public.journee_historique enable row level security;

create policy "lecture journee_historique" on public.journee_historique
  for select using (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() in ('administrateur', 'manager')
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = public.auth_ehpad_id()))
  );

alter table public.log_audit enable row level security;

create policy "lecture log_audit" on public.log_audit
  for select using (
    public.est_administrateur_systeme()
    or (public.auth_type_compte() = 'administrateur' and ehpad_id = public.auth_ehpad_id())
  );

-- ---------------------------------------------------------------------
-- Grants — RLS affine les droits, elle ne remplace pas les GRANT
-- PostgreSQL standards qui les précèdent. anon : aucun accès (toute
-- l'application exige une connexion). authenticated : accès brut à
-- toutes les tables, restreint ensuite ligne par ligne par RLS.
-- ---------------------------------------------------------------------

revoke all on all tables in schema public from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
