-- RLS — cf. note « type_compte : 3 niveaux de droits » et
-- « Multi-établissement » du modèle de données, migration 0008.
--
-- Les requêtes sensibles à RLS s'exécutent directement comme le rôle
-- `authenticated` (SET ROLE, hors bloc de fonction) plutôt qu'à travers
-- test.ok()/test.doit_echouer() seuls : ces deux fonctions sont SECURITY
-- DEFINER (nécessaire pour écrire dans test._resultats quel que soit
-- l'appelant), et Postgres interdit justement tout changement de rôle
-- depuis l'intérieur d'une fonction SECURITY DEFINER — vérifié
-- empiriquement avant d'écrire ce fichier (« cannot set parameter "role"
-- within security-definer function »). Le SET ROLE se fait donc toujours
-- au niveau du script, jamais dans le corps d'une fonction.

-- 1) Anonyme (aucun JWT) : aucune ligne visible nulle part
set role authenticated;
select count(*) as n from public.ehpad \gset rls_anon_
reset role;

select test.ok(:rls_anon_n = 0, 'RLS anonyme : aucun EHPAD visible', 'compte=' || :rls_anon_n);

-- 2) administrateur_systeme : voit tout, tous établissements
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select count(*) as n from public.ehpad \gset rls_admin_sys_ehpad_
select count(*) as n from public.administrateur_systeme \gset rls_admin_sys_admins_
reset role;
reset request.jwt.claim.sub;

select test.ok(:rls_admin_sys_ehpad_n = 1, 'RLS administrateur_systeme : voit l''EHPAD existant');
select test.ok(:rls_admin_sys_admins_n = 1, 'RLS administrateur_systeme : se voit lui-même');

-- 3) compte administrateur d'un EHPAD : scope à son établissement, aucune
--    visibilité sur administrateur_systeme
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select count(*) as n from public.ehpad \gset rls_admin_ehpad_ehpad_
select count(*) as n from public.salarie \gset rls_admin_ehpad_salaries_
select count(*) as n from public.administrateur_systeme \gset rls_admin_ehpad_admins_sys_
reset role;
reset request.jwt.claim.sub;

select test.ok(:rls_admin_ehpad_ehpad_n = 1, 'RLS compte administrateur : voit son propre EHPAD');
select test.ok(:rls_admin_ehpad_salaries_n = 1, 'RLS compte administrateur : voit les salariés de son EHPAD');
select test.ok(:rls_admin_ehpad_admins_sys_n = 0, 'RLS compte administrateur : aucun administrateur_systeme visible');

-- 4) compte manager : peut écrire sur journee, pas sur code_horaire
--    (« le manager peut modifier le planning, aucun accès à la
--    configuration » — jamais posé en base avant cette story)
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
insert into public.journee (salarie_id, date, code_travail_id)
values ('88888888-8888-8888-8888-888888888888', '2026-10-01', '44444444-4444-4444-4444-444444444444');
select count(*) as n from public.journee where date = '2026-10-01' \gset rls_manager_journee_

do $$
declare bloque boolean := false;
begin
  begin
    insert into public.code_horaire (ehpad_id, code, intitule, couleur_fond, couleur_texte, categorie)
    values ('33333333-3333-3333-3333-333333333333', 'MGR', 'Test manager', '#fff', '#000', 'travail');
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'RLS manager : ne peut pas créer de code horaire (configuration réservée à administrateur)');
end $$;

reset role;
reset request.jwt.claim.sub;

select test.ok(:rls_manager_journee_n = 1, 'RLS manager : peut poser un code sur une case de planning');

-- 5) compte utilisateur : lecture seule, aucune écriture sur journee
set role authenticated;
set request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

do $$
declare bloque boolean := false;
begin
  begin
    insert into public.journee (salarie_id, date, code_travail_id)
    values ('88888888-8888-8888-8888-888888888888', '2026-10-02', '44444444-4444-4444-4444-444444444444');
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'RLS utilisateur : ne peut pas poser de code sur une case de planning (lecture seule)');
end $$;

select count(*) as n from public.salarie \gset rls_utilisateur_salaries_
reset role;
reset request.jwt.claim.sub;

select test.ok(:rls_utilisateur_salaries_n = 1, 'RLS utilisateur : peut lire les salariés de son EHPAD');
