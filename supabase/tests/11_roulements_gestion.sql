-- Gestion des roulements (écran /admin/roulements, story #34/#35). RLS déjà
-- posée (roulement dans le groupe générique tables_ehpad_admin, roulement_jour
-- via policy dédiée résolue par la table parente, migration 0008) — jamais
-- testée à l'écriture avant cet écran. La cohérence catégorie du
-- code_horaire référencé par roulement_jour (doit être "travail") est déjà
-- testée en isolation dans 03_triggers.sql ; réutilise ici le code_horaire
-- de fixture '44444444-4444-4444-4444-444444444444' (catégorie travail).

-- 1) un administrateur peut créer un roulement et son motif (roulement_jour)
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.roulement (id, ehpad_id, nom, nb_semaines)
values ('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', '33333333-3333-3333-3333-333333333333', 'ASH matin', 1);
insert into public.roulement_jour (roulement_id, semaine_index, jour_semaine, code_horaire_id)
values ('e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', 0, 0, '44444444-4444-4444-4444-444444444444');
select count(*) as n from public.roulement where id = 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3' \gset roulement_cree_
select count(*) as n from public.roulement_jour where roulement_id = 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3' \gset jour_cree_
reset role;
reset request.jwt.claim.sub;

select test.ok(:roulement_cree_n = 1, 'gestion roulements : un administrateur peut créer un roulement pour son EHPAD');
select test.ok(:jour_cree_n = 1, 'gestion roulements : un administrateur peut créer le motif (roulement_jour) de son roulement');

-- 2) un administrateur peut modifier un roulement de son EHPAD (renommer)
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
update public.roulement set nom = 'ASH matin/soir' where id = 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3';
select nom from public.roulement where id = 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3' \gset roulement_modifie_
reset role;
reset request.jwt.claim.sub;

select test.ok(:'roulement_modifie_nom' = 'ASH matin/soir', 'gestion roulements : un administrateur peut modifier un roulement de son EHPAD');

-- 3) un manager ne peut pas créer de roulement
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

do $$
declare bloque boolean := false;
begin
  begin
    insert into public.roulement (ehpad_id, nom, nb_semaines)
    values ('33333333-3333-3333-3333-333333333333', 'Refusé', 1);
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'gestion roulements : un manager ne peut pas créer de roulement');
end $$;

reset role;
reset request.jwt.claim.sub;

-- 4) un manager ne peut pas modifier un roulement existant (RLS filtre
--    silencieusement, UPDATE 0 ligne — cf. le bug logo EHPAD du 25/09, même
--    classe de bug, désormais systématiquement testée)
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
update public.roulement set nom = 'Modifié par manager' where id = 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3';
select nom from public.roulement where id = 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3' \gset roulement_inchange_
reset role;
reset request.jwt.claim.sub;

select test.ok(:'roulement_inchange_nom' = 'ASH matin/soir', 'gestion roulements : un manager ne peut pas modifier un roulement (RLS filtre silencieusement, UPDATE 0 ligne)');

-- 5) un administrateur peut supprimer un roulement (cascade sur roulement_jour)
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
delete from public.roulement where id = 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3';
select count(*) as n from public.roulement where id = 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3' \gset roulement_supprime_
select count(*) as n from public.roulement_jour where roulement_id = 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3' \gset jour_cascade_
reset role;
reset request.jwt.claim.sub;

select test.ok(:roulement_supprime_n = 0, 'gestion roulements : un administrateur peut supprimer un roulement');
select test.ok(:jour_cascade_n = 0, 'gestion roulements : la suppression cascade sur le motif (roulement_jour)');
