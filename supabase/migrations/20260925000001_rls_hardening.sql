-- Durcissement RLS — suite à l'installation des agent skills officielles
-- Supabase (25/09) et à l'audit get_advisors sur le projet PROD après
-- application des migrations 0001-0009. Trois corrections, aucune ne
-- change le comportement fonctionnel (mêmes autorisations), uniquement
-- la performance et la défense en profondeur :
--
-- 1. Toutes les policies appellent nos fonctions utilitaires
--    (est_administrateur_systeme/auth_ehpad_id/auth_type_compte) sans les
--    envelopper dans (select ...) : Postgres les ré-évalue alors à chaque
--    ligne plutôt qu'une fois par requête (cf. référence Supabase
--    "Optimize RLS Policies for Performance", gain annoncé 5-10x).
--    L'audit initial n'avait remonté qu'une seule occurrence (table
--    application) ; en réalité le même défaut touche toutes les policies
--    de ce fichier, corrigé ici partout.
-- 2. `to authenticated` ajouté explicitement sur chaque policy — défense
--    en profondeur en plus du `revoke all ... from anon` déjà en place
--    (cf. skill "security-rls-basics").
-- 3. Les policies `for all` qui coexistaient avec une policy `for select`
--    séparée faisaient évaluer deux policies permissives pour chaque
--    lecture (signalé par l'audit : "multiple_permissive_policies", 9
--    tables) — remplacées par des policies insert/update/delete
--    explicites, sans chevauchement avec le select.
--
-- Complété par : revoke des EXECUTE inutiles sur les fonctions de
-- trigger (jamais censées être appelées hors trigger) et les 3 fonctions
-- utilitaires pour le rôle anon (déjà sans accès aux tables, mais
-- inutile de laisser l'appel RPC direct ouvert) ; 4 index manquants sur
-- clés étrangères des tables d'audit (cf. skill "schema-foreign-key-
-- indexes").

-- ---------------------------------------------------------------------
-- 1) administrateur_systeme, ehpad, application — pas de restructuration
--    (déjà 4 policies distinctes select/insert/update/delete), juste
--    (select ...) + to authenticated.
-- ---------------------------------------------------------------------

alter policy "lecture par administrateur systeme" on public.administrateur_systeme
  to authenticated using ((select public.est_administrateur_systeme()));
alter policy "ecriture par administrateur systeme" on public.administrateur_systeme
  to authenticated with check ((select public.est_administrateur_systeme()));
alter policy "modification par administrateur systeme" on public.administrateur_systeme
  to authenticated using ((select public.est_administrateur_systeme())) with check ((select public.est_administrateur_systeme()));
alter policy "suppression par administrateur systeme" on public.administrateur_systeme
  to authenticated using ((select public.est_administrateur_systeme()));

alter policy "lecture ehpad" on public.ehpad
  to authenticated using ((select public.est_administrateur_systeme()) or id = (select public.auth_ehpad_id()));
alter policy "ecriture ehpad par administrateur systeme" on public.ehpad
  to authenticated with check ((select public.est_administrateur_systeme()));
alter policy "modification ehpad par administrateur systeme" on public.ehpad
  to authenticated using ((select public.est_administrateur_systeme())) with check ((select public.est_administrateur_systeme()));
alter policy "suppression ehpad par administrateur systeme" on public.ehpad
  to authenticated using ((select public.est_administrateur_systeme()));

alter policy "lecture application" on public.application
  to authenticated using ((select auth.uid()) is not null);
alter policy "ecriture application par administrateur systeme" on public.application
  to authenticated with check ((select public.est_administrateur_systeme()));
alter policy "modification application par administrateur systeme" on public.application
  to authenticated using ((select public.est_administrateur_systeme())) with check ((select public.est_administrateur_systeme()));
alter policy "suppression application par administrateur systeme" on public.application
  to authenticated using ((select public.est_administrateur_systeme()));

-- ---------------------------------------------------------------------
-- 2) service/compte/salarie/code_horaire/roulement/annee_planifiee —
--    déjà 4 policies distinctes (boucle de la migration 0008), même
--    traitement, factorisé en boucle vu l'homogénéité.
-- ---------------------------------------------------------------------

do $$
declare
  t text;
  tables_ehpad_admin text[] := array[
    'service', 'compte', 'salarie', 'code_horaire', 'roulement', 'annee_planifiee'
  ];
begin
  foreach t in array tables_ehpad_admin loop
    execute format(
      'alter policy "lecture %1$s" on public.%1$I to authenticated using ((select public.est_administrateur_systeme()) or ehpad_id = (select public.auth_ehpad_id()))',
      t
    );
    execute format(
      'alter policy "ecriture %1$s" on public.%1$I to authenticated with check ((select public.est_administrateur_systeme()) or ((select public.auth_type_compte()) = ''administrateur'' and ehpad_id = (select public.auth_ehpad_id())))',
      t
    );
    execute format(
      'alter policy "modification %1$s" on public.%1$I to authenticated using ((select public.est_administrateur_systeme()) or ((select public.auth_type_compte()) = ''administrateur'' and ehpad_id = (select public.auth_ehpad_id()))) with check ((select public.est_administrateur_systeme()) or ((select public.auth_type_compte()) = ''administrateur'' and ehpad_id = (select public.auth_ehpad_id())))',
      t
    );
    execute format(
      'alter policy "suppression %1$s" on public.%1$I to authenticated using ((select public.est_administrateur_systeme()) or ((select public.auth_type_compte()) = ''administrateur'' and ehpad_id = (select public.auth_ehpad_id())))',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3) contrat — déjà 4 policies distinctes, même traitement.
-- ---------------------------------------------------------------------

alter policy "lecture contrat" on public.contrat
  to authenticated using (
    (select public.est_administrateur_systeme())
    or exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id()))
  );
alter policy "ecriture contrat" on public.contrat
  to authenticated with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  );
alter policy "modification contrat" on public.contrat
  to authenticated
  using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  )
  with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  );
alter policy "suppression contrat par administrateur systeme" on public.contrat
  to authenticated using ((select public.est_administrateur_systeme()));

-- ---------------------------------------------------------------------
-- 4) journee_historique, log_audit — lecture seule, déjà une policy
--    unique, même traitement.
-- ---------------------------------------------------------------------

alter policy "lecture journee_historique" on public.journee_historique
  to authenticated using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) in ('administrateur', 'manager')
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  );

alter policy "lecture log_audit" on public.log_audit
  to authenticated using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur' and ehpad_id = (select public.auth_ehpad_id()))
  );

-- ---------------------------------------------------------------------
-- 5) Tables avec une policy "for all" en plus d'une policy "for select"
--    séparée (9 tables, signalées par l'audit "multiple_permissive_
--    policies") — remplacées par insert/update/delete explicites, plus
--    de chevauchement avec le select. select ré-écrite avec (select ...)
--    + to authenticated au passage.
-- ---------------------------------------------------------------------

-- ehpad_application (direct ehpad_id, écriture administrateur système)
drop policy "lecture ehpad_application" on public.ehpad_application;
drop policy "ecriture ehpad_application par administrateur systeme" on public.ehpad_application;

create policy "lecture ehpad_application" on public.ehpad_application
  for select to authenticated using ((select public.est_administrateur_systeme()) or ehpad_id = (select public.auth_ehpad_id()));
create policy "ecriture ehpad_application" on public.ehpad_application
  for insert to authenticated with check ((select public.est_administrateur_systeme()));
create policy "modification ehpad_application" on public.ehpad_application
  for update to authenticated using ((select public.est_administrateur_systeme())) with check ((select public.est_administrateur_systeme()));
create policy "suppression ehpad_application" on public.ehpad_application
  for delete to authenticated using ((select public.est_administrateur_systeme()));

-- plage_horaire (via code_horaire, écriture administrateur)
drop policy "lecture plage_horaire" on public.plage_horaire;
drop policy "ecriture plage_horaire" on public.plage_horaire;

create policy "lecture plage_horaire" on public.plage_horaire
  for select to authenticated using (
    (select public.est_administrateur_systeme())
    or exists (select 1 from public.code_horaire c where c.id = code_horaire_id and c.ehpad_id = (select public.auth_ehpad_id()))
  );
create policy "ecriture plage_horaire" on public.plage_horaire
  for insert to authenticated with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.code_horaire c where c.id = code_horaire_id and c.ehpad_id = (select public.auth_ehpad_id())))
  );
create policy "modification plage_horaire" on public.plage_horaire
  for update to authenticated
  using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.code_horaire c where c.id = code_horaire_id and c.ehpad_id = (select public.auth_ehpad_id())))
  )
  with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.code_horaire c where c.id = code_horaire_id and c.ehpad_id = (select public.auth_ehpad_id())))
  );
create policy "suppression plage_horaire" on public.plage_horaire
  for delete to authenticated using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.code_horaire c where c.id = code_horaire_id and c.ehpad_id = (select public.auth_ehpad_id())))
  );

-- roulement_jour (via roulement, écriture administrateur)
drop policy "lecture roulement_jour" on public.roulement_jour;
drop policy "ecriture roulement_jour" on public.roulement_jour;

create policy "lecture roulement_jour" on public.roulement_jour
  for select to authenticated using (
    (select public.est_administrateur_systeme())
    or exists (select 1 from public.roulement r where r.id = roulement_id and r.ehpad_id = (select public.auth_ehpad_id()))
  );
create policy "ecriture roulement_jour" on public.roulement_jour
  for insert to authenticated with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.roulement r where r.id = roulement_id and r.ehpad_id = (select public.auth_ehpad_id())))
  );
create policy "modification roulement_jour" on public.roulement_jour
  for update to authenticated
  using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.roulement r where r.id = roulement_id and r.ehpad_id = (select public.auth_ehpad_id())))
  )
  with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.roulement r where r.id = roulement_id and r.ehpad_id = (select public.auth_ehpad_id())))
  );
create policy "suppression roulement_jour" on public.roulement_jour
  for delete to authenticated using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.roulement r where r.id = roulement_id and r.ehpad_id = (select public.auth_ehpad_id())))
  );

-- affectation_roulement (via salarie, écriture administrateur)
drop policy "lecture affectation_roulement" on public.affectation_roulement;
drop policy "ecriture affectation_roulement" on public.affectation_roulement;

create policy "lecture affectation_roulement" on public.affectation_roulement
  for select to authenticated using (
    (select public.est_administrateur_systeme())
    or exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id()))
  );
create policy "ecriture affectation_roulement" on public.affectation_roulement
  for insert to authenticated with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  );
create policy "modification affectation_roulement" on public.affectation_roulement
  for update to authenticated
  using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  )
  with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  );
create policy "suppression affectation_roulement" on public.affectation_roulement
  for delete to authenticated using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  );

-- jour_ferie (via annee_planifiee, écriture administrateur)
drop policy "lecture jour_ferie" on public.jour_ferie;
drop policy "ecriture jour_ferie" on public.jour_ferie;

create policy "lecture jour_ferie" on public.jour_ferie
  for select to authenticated using (
    (select public.est_administrateur_systeme())
    or exists (select 1 from public.annee_planifiee a where a.id = annee_planifiee_id and a.ehpad_id = (select public.auth_ehpad_id()))
  );
create policy "ecriture jour_ferie" on public.jour_ferie
  for insert to authenticated with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.annee_planifiee a where a.id = annee_planifiee_id and a.ehpad_id = (select public.auth_ehpad_id())))
  );
create policy "modification jour_ferie" on public.jour_ferie
  for update to authenticated
  using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.annee_planifiee a where a.id = annee_planifiee_id and a.ehpad_id = (select public.auth_ehpad_id())))
  )
  with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.annee_planifiee a where a.id = annee_planifiee_id and a.ehpad_id = (select public.auth_ehpad_id())))
  );
create policy "suppression jour_ferie" on public.jour_ferie
  for delete to authenticated using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.annee_planifiee a where a.id = annee_planifiee_id and a.ehpad_id = (select public.auth_ehpad_id())))
  );

-- compte_application (via compte, écriture administrateur)
drop policy "lecture compte_application" on public.compte_application;
drop policy "ecriture compte_application" on public.compte_application;

create policy "lecture compte_application" on public.compte_application
  for select to authenticated using (
    (select public.est_administrateur_systeme())
    or exists (select 1 from public.compte c where c.id = compte_id and c.ehpad_id = (select public.auth_ehpad_id()))
  );
create policy "ecriture compte_application" on public.compte_application
  for insert to authenticated with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.compte c where c.id = compte_id and c.ehpad_id = (select public.auth_ehpad_id())))
  );
create policy "modification compte_application" on public.compte_application
  for update to authenticated
  using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.compte c where c.id = compte_id and c.ehpad_id = (select public.auth_ehpad_id())))
  )
  with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.compte c where c.id = compte_id and c.ehpad_id = (select public.auth_ehpad_id())))
  );
create policy "suppression compte_application" on public.compte_application
  for delete to authenticated using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur'
        and exists (select 1 from public.compte c where c.id = compte_id and c.ehpad_id = (select public.auth_ehpad_id())))
  );

-- journee (via salarie, écriture administrateur + manager)
drop policy "lecture journee" on public.journee;
drop policy "ecriture journee" on public.journee;

create policy "lecture journee" on public.journee
  for select to authenticated using (
    (select public.est_administrateur_systeme())
    or exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id()))
  );
create policy "ecriture journee" on public.journee
  for insert to authenticated with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) in ('administrateur', 'manager')
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  );
create policy "modification journee" on public.journee
  for update to authenticated
  using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) in ('administrateur', 'manager')
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  )
  with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) in ('administrateur', 'manager')
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  );
create policy "suppression journee" on public.journee
  for delete to authenticated using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) in ('administrateur', 'manager')
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  );

-- journee_evenementiel_plage (via journee+salarie, écriture administrateur + manager)
drop policy "lecture journee_evenementiel_plage" on public.journee_evenementiel_plage;
drop policy "ecriture journee_evenementiel_plage" on public.journee_evenementiel_plage;

create policy "lecture journee_evenementiel_plage" on public.journee_evenementiel_plage
  for select to authenticated using (
    (select public.est_administrateur_systeme())
    or exists (
      select 1 from public.journee j
      join public.salarie s on s.id = j.salarie_id
      where j.id = journee_id and s.ehpad_id = (select public.auth_ehpad_id())
    )
  );
create policy "ecriture journee_evenementiel_plage" on public.journee_evenementiel_plage
  for insert to authenticated with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) in ('administrateur', 'manager')
        and exists (
          select 1 from public.journee j
          join public.salarie s on s.id = j.salarie_id
          where j.id = journee_id and s.ehpad_id = (select public.auth_ehpad_id())
        ))
  );
create policy "modification journee_evenementiel_plage" on public.journee_evenementiel_plage
  for update to authenticated
  using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) in ('administrateur', 'manager')
        and exists (
          select 1 from public.journee j
          join public.salarie s on s.id = j.salarie_id
          where j.id = journee_id and s.ehpad_id = (select public.auth_ehpad_id())
        ))
  )
  with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) in ('administrateur', 'manager')
        and exists (
          select 1 from public.journee j
          join public.salarie s on s.id = j.salarie_id
          where j.id = journee_id and s.ehpad_id = (select public.auth_ehpad_id())
        ))
  );
create policy "suppression journee_evenementiel_plage" on public.journee_evenementiel_plage
  for delete to authenticated using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) in ('administrateur', 'manager')
        and exists (
          select 1 from public.journee j
          join public.salarie s on s.id = j.salarie_id
          where j.id = journee_id and s.ehpad_id = (select public.auth_ehpad_id())
        ))
  );

-- validation_emargement (via salarie, écriture administrateur + manager)
drop policy "lecture validation_emargement" on public.validation_emargement;
drop policy "ecriture validation_emargement" on public.validation_emargement;

create policy "lecture validation_emargement" on public.validation_emargement
  for select to authenticated using (
    (select public.est_administrateur_systeme())
    or exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id()))
  );
create policy "ecriture validation_emargement" on public.validation_emargement
  for insert to authenticated with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) in ('administrateur', 'manager')
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  );
create policy "modification validation_emargement" on public.validation_emargement
  for update to authenticated
  using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) in ('administrateur', 'manager')
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  )
  with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) in ('administrateur', 'manager')
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  );
create policy "suppression validation_emargement" on public.validation_emargement
  for delete to authenticated using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) in ('administrateur', 'manager')
        and exists (select 1 from public.salarie s where s.id = salarie_id and s.ehpad_id = (select public.auth_ehpad_id())))
  );

-- ---------------------------------------------------------------------
-- 6) Fonctions : revoke des EXECUTE non nécessaires. Les 3 fonctions
--    utilitaires restent exécutables par authenticated (les policies
--    ci-dessus les appellent, ce qui exige ce droit), mais n'ont aucune
--    raison d'être appelables par anon (déjà sans accès aux tables, mais
--    autant fermer l'appel RPC direct). Les 2 fonctions de trigger ne
--    sont jamais censées être appelées hors trigger — le déclenchement
--    d'un trigger ne dépend pas des droits EXECUTE du rôle qui fait le
--    DML, donc ce revoke n'affecte pas leur fonctionnement.
-- ---------------------------------------------------------------------

revoke execute on function public.est_administrateur_systeme() from anon;
revoke execute on function public.auth_ehpad_id() from anon;
revoke execute on function public.auth_type_compte() from anon;
revoke execute on function public.tracer_journee_historique() from anon, authenticated;
revoke execute on function public.tracer_log_audit() from anon, authenticated;

-- ---------------------------------------------------------------------
-- 7) Index manquants sur clés étrangères (tables d'audit) — signalés par
--    get_advisors (performance).
-- ---------------------------------------------------------------------

create index journee_historique_code_travail_id_idx on public.journee_historique (code_travail_id);
create index journee_historique_code_evenementiel_id_idx on public.journee_historique (code_evenementiel_id);
create index journee_historique_compte_id_auteur_idx on public.journee_historique (compte_id_auteur);
create index log_audit_compte_id_auteur_idx on public.log_audit (compte_id_auteur);
