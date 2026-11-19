-- Création/suppression d'EHPAD par l'Administrateur Système (écran
-- /compte/ehpads, story #34) — policies déjà posées en migration 0008/
-- hardening, jamais testées à l'insert/delete jusqu'ici (seul le select
-- l'était, dans 04_rls.sql).

-- 1) administrateur_systeme peut créer un EHPAD
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.ehpad (id, nom) values ('99999999-9999-9999-9999-999999999999', 'EHPAD Gestion Test');
select count(*) as n from public.ehpad where id = '99999999-9999-9999-9999-999999999999' \gset ehpad_creation_
reset role;
reset request.jwt.claim.sub;

select test.ok(:ehpad_creation_n = 1, 'gestion EHPAD : administrateur_systeme peut créer un EHPAD');

-- 2) un compte administrateur (pas administrateur_systeme) ne peut pas créer
--    d'EHPAD
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$
declare bloque boolean := false;
begin
  begin
    insert into public.ehpad (nom) values ('EHPAD refusé');
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'gestion EHPAD : un compte administrateur (non système) ne peut pas créer d''EHPAD');
end $$;

reset role;
reset request.jwt.claim.sub;

-- 3) un compte administrateur ne peut pas supprimer d'EHPAD (même le sien)
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
delete from public.ehpad where id = '33333333-3333-3333-3333-333333333333';
select count(*) as n from public.ehpad where id = '33333333-3333-3333-3333-333333333333' \gset ehpad_suppr_refusee_
reset role;
reset request.jwt.claim.sub;

select test.ok(:ehpad_suppr_refusee_n = 1, 'gestion EHPAD : un compte administrateur ne peut pas supprimer d''EHPAD (RLS filtre silencieusement, DELETE 0 ligne)');

-- 4) administrateur_systeme peut supprimer un EHPAD, cascade sur ce qui en
--    dépend (ici : aucun compte/salarié rattaché à l'EHPAD de test créé au
--    point 1, la cascade elle-même est déjà couverte par les FK "on delete
--    cascade" du modèle de données, pas re-testée ligne à ligne ici)
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
delete from public.ehpad where id = '99999999-9999-9999-9999-999999999999';
select count(*) as n from public.ehpad where id = '99999999-9999-9999-9999-999999999999' \gset ehpad_suppr_
reset role;
reset request.jwt.claim.sub;

select test.ok(:ehpad_suppr_n = 0, 'gestion EHPAD : administrateur_systeme peut supprimer un EHPAD');

-- 4bis) bug réel détecté le 19/11 : supprimer un EHPAD qui a des données
-- liées (donc une vraie cascade "on delete cascade") échouait avec
-- "insert or update on table log_audit violates foreign key constraint
-- log_audit_ehpad_id_fkey" — tracer_log_audit() (posé sur service, compte,
-- salarie...) tentait de logger chaque suppression en cascade avec
-- l'ehpad_id de l'EHPAD... déjà supprimé à cet instant. Le point 4
-- ci-dessus ne l'attrapait pas, faute de toute donnée liée sur l'EHPAD de
-- test. Corrigé en migration 20261119000001.
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.ehpad (id, nom) values ('99999999-9999-9999-9999-999999999998', 'EHPAD Gestion Test Cascade');
insert into public.service (id, ehpad_id, nom, ordre)
  values ('99999999-9999-9999-9999-999999999997', '99999999-9999-9999-9999-999999999998', 'Service Cascade', 1);

do $$
declare echoue boolean := false;
begin
  begin
    delete from public.ehpad where id = '99999999-9999-9999-9999-999999999998';
  exception when others then
    echoue := true;
  end;
  perform test.ok(not echoue, 'gestion EHPAD : suppression d''un EHPAD avec données liées (cascade) ne lève pas d''erreur FK sur log_audit');
end $$;

select count(*) as n from public.ehpad where id = '99999999-9999-9999-9999-999999999998' \gset ehpad_cascade_suppr_
select test.ok(:ehpad_cascade_suppr_n = 0, 'gestion EHPAD : l''EHPAD et son service lié sont bien supprimés malgré la cascade');

-- 2 lignes attendues à ehpad_id null : celle de la suppression en cascade
-- elle-même (créée par mon correctif, cf. migration 20261119000001), et
-- celle de la création du service un peu plus tôt dans ce même test, dont
-- l'ehpad_id est mis à null rétroactivement par le "on delete set null"
-- déjà en place sur log_audit.ehpad_id (comportement normal, pas un
-- effet de mon correctif).
select count(*) as n from public.log_audit
where entite = 'service' and entite_id = '99999999-9999-9999-9999-999999999997' and ehpad_id is null
\gset log_cascade_
select test.ok(:log_cascade_n = 2, 'gestion EHPAD : les lignes d''audit du service (création et suppression en cascade) existent, avec ehpad_id mis à null plutôt que de bloquer');

reset role;
reset request.jwt.claim.sub;

-- 5) un compte administrateur peut modifier l'identité (nom/logo) de son
--    propre EHPAD (écran /admin/ehpad, migration 20260925000007 — bug réel
--    détecté le 25/09 : cette policy n'autorisait jusqu'ici que
--    administrateur_systeme, upload de logo silencieusement non enregistré)
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
update public.ehpad set nom = 'EHPAD Test modifié' where id = '33333333-3333-3333-3333-333333333333';
select nom from public.ehpad where id = '33333333-3333-3333-3333-333333333333' \gset ehpad_nom_modifie_
reset role;
reset request.jwt.claim.sub;

select test.ok(:'ehpad_nom_modifie_nom' = 'EHPAD Test modifié', 'gestion EHPAD : un administrateur peut modifier le nom de son propre EHPAD');

update public.ehpad set nom = 'EHPAD Test' where id = '33333333-3333-3333-3333-333333333333';

-- 6) un compte manager (pas administrateur) ne peut pas modifier l'EHPAD
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
update public.ehpad set nom = 'EHPAD modifié par manager' where id = '33333333-3333-3333-3333-333333333333';
select nom from public.ehpad where id = '33333333-3333-3333-3333-333333333333' \gset ehpad_nom_inchange_
reset role;
reset request.jwt.claim.sub;

select test.ok(:'ehpad_nom_inchange_nom' = 'EHPAD Test', 'gestion EHPAD : un compte manager ne peut pas modifier l''EHPAD (RLS filtre silencieusement, UPDATE 0 ligne)');
