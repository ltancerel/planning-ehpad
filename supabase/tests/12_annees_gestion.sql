-- Gestion de l'écran /admin/annees (story #34/#35) au-delà du RPC
-- generer_annee_planifiee lui-même (déjà testé en isolation dans
-- 07_generer_annee_planifiee.sql) : modification de annee_planifiee et
-- réconciliation des jours fériés (bascule actif sur un jour calculé,
-- ajout/suppression de jours personnalisés) — jamais testées à l'écriture.
-- Réutilise l'année 2027 créée par le test 07 pour l'EHPAD de fixture.

select id from public.annee_planifiee where ehpad_id = '33333333-3333-3333-3333-333333333333' and annee = 2027 \gset annee2027_

-- 1) un administrateur peut modifier le jour de démarrage d'une année
--    déjà planifiée
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
update public.annee_planifiee set jour_demarrage = '2027-01-04' where id = :'annee2027_id';
select jour_demarrage from public.annee_planifiee where id = :'annee2027_id' \gset annee2027_modifiee_
reset role;
reset request.jwt.claim.sub;

select test.ok(:'annee2027_modifiee_jour_demarrage' = '2027-01-04', 'gestion années : un administrateur peut modifier le jour de démarrage de son EHPAD');

-- 2) un administrateur peut désactiver un jour férié calculé (ex.
--    l'Ascension), sans toucher aux jours fixes
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
update public.jour_ferie set actif = false
  where annee_planifiee_id = :'annee2027_id' and type = 'calcule' and label = 'Ascension';
select actif from public.jour_ferie where annee_planifiee_id = :'annee2027_id' and label = 'Ascension' \gset ascension_
reset role;
reset request.jwt.claim.sub;

select test.ok(:'ascension_actif' = 'f', 'gestion années : un administrateur peut désactiver un jour férié calculé');

-- 3) un administrateur peut ajouter un jour férié personnalisé
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.jour_ferie (annee_planifiee_id, date, label, type, actif)
values (:'annee2027_id', '2027-06-11', 'Journée EHPAD', 'personnalise', true);
select count(*) as n from public.jour_ferie where annee_planifiee_id = :'annee2027_id' and type = 'personnalise' \gset personnalise_cree_
reset role;
reset request.jwt.claim.sub;

select test.ok(:personnalise_cree_n = 1, 'gestion années : un administrateur peut ajouter un jour férié personnalisé');

-- 4) un administrateur peut supprimer un jour férié personnalisé (retiré
--    du formulaire, remplacement complet côté action serveur)
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
delete from public.jour_ferie where annee_planifiee_id = :'annee2027_id' and type = 'personnalise';
select count(*) as n from public.jour_ferie where annee_planifiee_id = :'annee2027_id' and type = 'personnalise' \gset personnalise_supprime_
reset role;
reset request.jwt.claim.sub;

select test.ok(:personnalise_supprime_n = 0, 'gestion années : un administrateur peut supprimer un jour férié personnalisé');

-- 5) un manager ne peut pas modifier une année planifiée (RLS filtre
--    silencieusement, UPDATE 0 ligne — même classe de bug que le logo
--    EHPAD du 25/09, systématiquement testée depuis)
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
update public.annee_planifiee set jour_demarrage = '2027-01-11' where id = :'annee2027_id';
select jour_demarrage from public.annee_planifiee where id = :'annee2027_id' \gset annee2027_inchangee_
reset role;
reset request.jwt.claim.sub;

select test.ok(:'annee2027_inchangee_jour_demarrage' = '2027-01-04', 'gestion années : un manager ne peut pas modifier le jour de démarrage (RLS filtre silencieusement, UPDATE 0 ligne)');

-- 6) un manager ne peut pas ajouter de jour férié. L'id de l'année 2027 est
--    résolu par une sous-requête SQL plutôt qu'une variable psql :
--    l'interpolation :'var' de psql ne s'applique pas à l'intérieur d'un
--    bloc dollar-quoté (do $$ ... $$), comme déjà le cas ailleurs dans
--    cette suite (identifiants toujours en dur dans ces blocs).
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

do $$
declare bloque boolean := false;
begin
  begin
    insert into public.jour_ferie (annee_planifiee_id, date, label, type, actif)
    values (
      (select id from public.annee_planifiee where ehpad_id = '33333333-3333-3333-3333-333333333333' and annee = 2027),
      '2027-07-14', 'Refusé', 'personnalise', true
    );
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'gestion années : un manager ne peut pas ajouter de jour férié');
end $$;

reset role;
reset request.jwt.claim.sub;
