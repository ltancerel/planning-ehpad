-- Gestion des salariés/services par l'Administrateur d'un EHPAD (écran
-- /admin/salaries, story #34/#35). RLS déjà posée (service/salarie dans le
-- groupe générique tables_ehpad_admin, migration 0008) — jamais testée à
-- l'écriture avant cet écran.

-- 1) un administrateur peut créer un service pour son EHPAD
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.service (id, ehpad_id, nom, ordre)
values ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '33333333-3333-3333-3333-333333333333', 'Cuisine', 99);
select count(*) as n from public.service where id = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1' \gset service_cree_
reset role;
reset request.jwt.claim.sub;

select test.ok(:service_cree_n = 1, 'gestion salariés : un administrateur peut créer un service pour son EHPAD');

-- 2) un manager ne peut pas créer de service
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

do $$
declare bloque boolean := false;
begin
  begin
    insert into public.service (ehpad_id, nom, ordre)
    values ('33333333-3333-3333-3333-333333333333', 'Service refusé', 100);
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'gestion salariés : un manager ne peut pas créer de service');
end $$;

reset role;
reset request.jwt.claim.sub;

-- 3) un administrateur peut créer un salarié rattaché à ce service
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.salarie (id, ehpad_id, service_id, matricule, nom, prenom, presence)
values (
  'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2',
  '33333333-3333-3333-3333-333333333333',
  'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
  'ZTST', 'Test', 'Salarié', 'Présent'
);
select count(*) as n from public.salarie where id = 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2' \gset salarie_cree_
reset role;
reset request.jwt.claim.sub;

select test.ok(:salarie_cree_n = 1, 'gestion salariés : un administrateur peut créer un salarié pour son EHPAD');

-- 4) un manager ne peut pas créer de salarié
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

do $$
declare bloque boolean := false;
begin
  begin
    insert into public.salarie (ehpad_id, service_id, matricule, nom, prenom, presence)
    values (
      '33333333-3333-3333-3333-333333333333',
      'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
      'REFU', 'Refuse', 'Test', 'Présent'
    );
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'gestion salariés : un manager ne peut pas créer de salarié');
end $$;

reset role;
reset request.jwt.claim.sub;

-- 5) un administrateur peut modifier le type de paie d'un salarié (défaut
--    "Aucun" à la création, cf. migration 20261029000001 — remplace
--    l'ancien concept de contrat CDI/CDD historisé)
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select type_paie from public.salarie where id = 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2' \gset type_paie_defaut_
update public.salarie set type_paie = '25/M' where id = 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2';
select type_paie from public.salarie where id = 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2' \gset type_paie_modifie_
reset role;
reset request.jwt.claim.sub;

select test.ok(:'type_paie_defaut_type_paie' = 'Aucun', 'gestion salariés : le type de paie par défaut est "Aucun" à la création');
select test.ok(:'type_paie_modifie_type_paie' = '25/M', 'gestion salariés : un administrateur peut modifier le type de paie de son salarié');

-- 6) un administrateur peut renommer un service de son EHPAD (retour
--    client du 30/10 : jusqu'ici aucun moyen de modifier un service créé)
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.service (id, ehpad_id, nom, ordre)
values ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', '33333333-3333-3333-3333-333333333333', 'Temp Renommage', 101);
update public.service set nom = 'Nouveau Nom' where id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1';
select nom from public.service where id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1' \gset service_renomme_
reset role;
reset request.jwt.claim.sub;

select test.ok(:'service_renomme_nom' = 'Nouveau Nom', 'gestion salariés : un administrateur peut renommer un service de son EHPAD');

-- 7) un manager ne peut pas renommer un service (RLS filtre silencieusement, UPDATE 0 ligne)
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
update public.service set nom = 'Modifié par manager' where id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1';
select nom from public.service where id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1' \gset service_inchange_
reset role;
reset request.jwt.claim.sub;

select test.ok(:'service_inchange_nom' = 'Nouveau Nom', 'gestion salariés : un manager ne peut pas renommer un service (RLS filtre silencieusement, UPDATE 0 ligne)');

-- 8) un administrateur ne peut pas supprimer un service encore utilisé par
--    un salarié (salarie.service_id est "on delete restrict")
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$
declare bloque boolean := false;
begin
  begin
    delete from public.service where id = '77777777-7777-7777-7777-777777777777';
  exception when foreign_key_violation then
    bloque := true;
  end;
  perform test.ok(bloque, 'gestion salariés : un administrateur ne peut pas supprimer un service encore utilisé par un salarié');
end $$;

reset role;
reset request.jwt.claim.sub;

-- 9) un administrateur peut supprimer un service sans salarié rattaché
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
delete from public.service where id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1';
select count(*) as n from public.service where id = 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1' \gset service_supprime_
reset role;
reset request.jwt.claim.sub;

select test.ok(:service_supprime_n = 0, 'gestion salariés : un administrateur peut supprimer un service sans salarié rattaché');

