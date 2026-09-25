-- Gestion des salariés/services par l'Administrateur d'un EHPAD (écran
-- /admin/salaries, story #34/#35). RLS déjà posée (service/salarie dans le
-- groupe générique tables_ehpad_admin, contrat via policy dédiée,
-- migration 0008) — jamais testée à l'écriture avant cet écran.

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

-- 5) un administrateur peut créer un contrat actif pour ce salarié
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.contrat (salarie_id, type_contrat, date_debut, actif)
values ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'CDI', current_date, true);
select count(*) as n from public.contrat where salarie_id = 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2' and actif \gset contrat_cree_
reset role;
reset request.jwt.claim.sub;

select test.ok(:contrat_cree_n = 1, 'gestion salariés : un administrateur peut créer un contrat actif pour son salarié');

-- 6) bascule de contrat (CDI -> CDD) : clôture (date_fin) puis nouveau,
--    jamais deux actifs à la fois — reproduit la séquence réelle de
--    l'écran (UPDATE puis INSERT), pas juste la contrainte en isolation
--    (déjà testée côté contraintes, 02_contraintes.sql)
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
update public.contrat set actif = false, date_fin = current_date
where salarie_id = 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2' and actif;
insert into public.contrat (salarie_id, type_contrat, date_debut, actif)
values ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'CDD', current_date, true);
select count(*) as n from public.contrat where salarie_id = 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2' and actif \gset contrat_bascule_
reset role;
reset request.jwt.claim.sub;

select test.ok(:contrat_bascule_n = 1, 'gestion salariés : bascule CDI→CDD sans jamais deux contrats actifs à la fois');
