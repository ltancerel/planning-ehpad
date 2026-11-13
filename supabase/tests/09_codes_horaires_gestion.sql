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

-- 5) un administrateur peut remplacer les plages d'un code horaire
--    existant (delete puis insert, comme le fait l'écran de modification
--    src/app/admin/horaires/actions.ts) — jamais testé avant le bug
--    signalé le 13/11 sur le code 70A (RLS plage_horaire jamais exercée
--    en remplacement, seulement en création à l'étape 1).
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.code_horaire (id, ehpad_id, code, intitule, couleur_fond, couleur_texte, categorie)
values ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', '33333333-3333-3333-3333-333333333333', 'MOD', 'Modifiable', '#fff', '#000', 'travail');
insert into public.plage_horaire (code_horaire_id, ordre, heure_debut, heure_fin)
values ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 1, '07:00', '13:00');

delete from public.plage_horaire where code_horaire_id = 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2';
insert into public.plage_horaire (code_horaire_id, ordre, heure_debut, heure_fin)
values
  ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 1, '07:00', '13:00'),
  ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 2, '14:00', '19:00'),
  ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 3, '20:00', '22:00');

select count(*) as n from public.plage_horaire where code_horaire_id = 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' \gset plages_remplacees_
select count(*) as n from public.plage_horaire where code_horaire_id = 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' and heure_debut = '14:00' and heure_fin = '19:00' \gset plage_ajoutee_

delete from public.code_horaire where id = 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2';
reset role;
reset request.jwt.claim.sub;

select test.ok(:plages_remplacees_n = 3, 'gestion codes horaires : un administrateur peut remplacer les plages d''un code (passer de 1 à 3)');
select test.ok(:plage_ajoutee_n = 1, 'gestion codes horaires : la nouvelle plage ajoutée est bien celle soumise');
