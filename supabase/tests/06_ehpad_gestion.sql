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
