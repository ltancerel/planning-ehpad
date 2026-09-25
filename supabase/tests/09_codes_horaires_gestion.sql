-- Gestion des codes horaires par l'Administrateur d'un EHPAD (écran
-- /admin/horaires, story #34/#35). RLS déjà posée (code_horaire dans le
-- groupe générique tables_ehpad_admin, plage_horaire via policy dédiée,
-- migration 0008) — jamais testée à l'écriture avant cet écran. Les 4
-- CHECK de cohérence categorie/type_evenement/duree_heures sont déjà
-- testés en isolation dans 02_contraintes.sql.

-- 1) un administrateur peut créer un code horaire de travail avec ses
--    plages
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.code_horaire (id, ehpad_id, code, intitule, couleur_fond, couleur_texte, categorie)
values ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', '33333333-3333-3333-3333-333333333333', 'MAT', 'Matin', '#fff', '#000', 'travail');
insert into public.plage_horaire (code_horaire_id, ordre, heure_debut, heure_fin)
values ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 1, '07:00', '14:00');
select count(*) as n from public.code_horaire where id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1' \gset code_cree_
select count(*) as n from public.plage_horaire where code_horaire_id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1' \gset plage_creee_
reset role;
reset request.jwt.claim.sub;

select test.ok(:code_cree_n = 1, 'gestion codes horaires : un administrateur peut créer un code horaire');
select test.ok(:plage_creee_n = 1, 'gestion codes horaires : un administrateur peut créer une plage horaire pour son code');

-- 2) un manager ne peut pas créer de code horaire
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

do $$
declare bloque boolean := false;
begin
  begin
    insert into public.code_horaire (ehpad_id, code, intitule, couleur_fond, couleur_texte, categorie)
    values ('33333333-3333-3333-3333-333333333333', 'REF', 'Refusé', '#fff', '#000', 'informatif');
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'gestion codes horaires : un manager ne peut pas créer de code horaire');
end $$;

reset role;
reset request.jwt.claim.sub;

-- 3) un manager ne peut pas ajouter de plage horaire à un code existant
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

do $$
declare bloque boolean := false;
begin
  begin
    insert into public.plage_horaire (code_horaire_id, ordre, heure_debut, heure_fin)
    values ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 2, '14:00', '21:00');
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'gestion codes horaires : un manager ne peut pas ajouter de plage horaire');
end $$;

reset role;
reset request.jwt.claim.sub;

-- 4) un administrateur peut supprimer un code horaire (cascade sur ses
--    plages, déjà garanti par la FK "on delete cascade")
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
delete from public.code_horaire where id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1';
select count(*) as n from public.code_horaire where id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1' \gset code_supprime_
select count(*) as n from public.plage_horaire where code_horaire_id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1' \gset plage_cascade_
reset role;
reset request.jwt.claim.sub;

select test.ok(:code_supprime_n = 0, 'gestion codes horaires : un administrateur peut supprimer un code horaire');
select test.ok(:plage_cascade_n = 0, 'gestion codes horaires : la suppression cascade sur les plages horaires');
