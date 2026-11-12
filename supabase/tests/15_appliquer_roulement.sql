-- RPC appliquer_roulement (story #35, dernier incrément) : assignation
-- d'un roulement à un salarié (affectation_roulement, jamais testée avant
-- cet écran) puis application réelle du motif sur la grille (journee),
-- avec la règle "tout ou rien" et la traçabilité dédiée.
--
-- Roulement de fixture dédié (2 semaines) : lundi de chaque semaine en
-- code travail (fixture '44444444', catégorie travail), reste de la
-- semaine en repos (aucune ligne roulement_jour = repos, comme côté
-- maquette). Dates calées sur une semaine future pour ne percuter aucune
-- donnée déjà écrite par les tests précédents.

insert into public.roulement (id, ehpad_id, nom, nb_semaines)
values ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', '33333333-3333-3333-3333-333333333333', 'Test appliquer_roulement', 2);
insert into public.roulement_jour (roulement_id, semaine_index, jour_semaine, code_horaire_id) values
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 0, 0, '44444444-4444-4444-4444-444444444444'),
  ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 1, 0, '44444444-4444-4444-4444-444444444444');

select (date_trunc('week', current_date + interval '28 days'))::date as lundi \gset

-- 1) un administrateur peut assigner un roulement à un salarié
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.affectation_roulement (id, salarie_id, roulement_id, date_debut)
values ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', '88888888-8888-8888-8888-888888888888',
        'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', date_trunc('week', current_date)::date);
select count(*) as n from public.affectation_roulement where id = 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2' \gset affectation_creee_
reset role;
reset request.jwt.claim.sub;

select test.ok(:affectation_creee_n = 1, 'appliquer_roulement : un administrateur peut assigner un roulement à un salarié');

-- 2) un manager ne peut pas assigner de roulement
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

do $$
declare bloque boolean := false;
begin
  begin
    insert into public.affectation_roulement (salarie_id, roulement_id, date_debut)
    values ('88888888-8888-8888-8888-888888888888', 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', current_date);
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'appliquer_roulement : un manager ne peut pas assigner de roulement');
end $$;

reset role;
reset request.jwt.claim.sub;

-- 3) sans roulement assigné, la RPC renvoie applique = false, sans rien écrire
insert into public.salarie (id, ehpad_id, service_id, matricule, nom, prenom, presence)
values ('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', '33333333-3333-3333-3333-333333333333',
        '77777777-7777-7777-7777-777777777777', 'FFFF', 'SansRoulement', 'Test', 'Présent');

set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select applique, semaine_bloquee from public.appliquer_roulement(
  'f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', :'lundi'::date, 1
) \gset sans_roulement_
reset role;
reset request.jwt.claim.sub;

select test.ok(not :'sans_roulement_applique'::boolean, 'appliquer_roulement : renvoie applique=false pour un salarié sans roulement assigné');

-- 4) application réelle du motif (2 semaines, depart=1) : écrit les 2 lundis
--    en code travail, le reste de chaque semaine reste repos (ligne journee
--    existante, tous les codes à NULL)
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select applique, semaine_bloquee from public.appliquer_roulement(
  '88888888-8888-8888-8888-888888888888', :'lundi'::date, 1
) \gset application_
reset role;
reset request.jwt.claim.sub;

select test.ok(:'application_applique'::boolean, 'appliquer_roulement : applique=true quand aucune semaine concernée n''est déjà remplie');

select code_travail_id as lundi_s1_travail from public.journee
where salarie_id = '88888888-8888-8888-8888-888888888888' and date = :'lundi'::date \gset verif_
select test.ok(
  :'verif_lundi_s1_travail' = '44444444-4444-4444-4444-444444444444',
  'appliquer_roulement : le lundi de la semaine 1 porte bien le code travail du motif'
);

select count(*) as n, count(code_travail_id) as avec_travail from public.journee
where salarie_id = '88888888-8888-8888-8888-888888888888' and date = (:'lundi'::date + 1) \gset mardi_
select test.ok(
  :mardi_n = 1 and :mardi_avec_travail = 0,
  'appliquer_roulement : le mardi (repos du motif) a bien une case posée, sans code travail'
);

select code_travail_id as lundi_s2_travail from public.journee
where salarie_id = '88888888-8888-8888-8888-888888888888' and date = (:'lundi'::date + 7) \gset verif2_
select test.ok(
  :'verif2_lundi_s2_travail' = '44444444-4444-4444-4444-444444444444',
  'appliquer_roulement : le lundi de la semaine 2 porte aussi le code travail du motif'
);

select count(*) as n from public.journee_historique
where salarie_id = '88888888-8888-8888-8888-888888888888' and date = :'lundi'::date
  and type_operation = 'application_roulement' \gset historique_
select test.ok(
  :historique_n >= 1,
  'appliquer_roulement : journee_historique trace bien type_operation = application_roulement'
);

select count(*) as n from public.log_audit
where entite = 'roulement' and entite_id = 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1'
  and type_operation = 'application_roulement' \gset audit_
select test.ok(
  :audit_n >= 1,
  'appliquer_roulement : une ligne de synthèse est insérée dans log_audit'
);

-- 5) tout ou rien : réappliquer sur la même période (désormais remplie)
--    bloque entièrement, sans rien modifier
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select applique, semaine_bloquee from public.appliquer_roulement(
  '88888888-8888-8888-8888-888888888888', :'lundi'::date, 1
) \gset reapplication_
reset role;
reset request.jwt.claim.sub;

select test.ok(
  not :'reapplication_applique'::boolean and :'reapplication_semaine_bloquee' = :'lundi',
  'appliquer_roulement : refuse tout (tout ou rien) si la semaine est déjà remplie, et signale la bonne semaine'
);

-- Nettoyage
delete from public.journee where salarie_id = '88888888-8888-8888-8888-888888888888'
  and date in (:'lundi'::date, :'lundi'::date + 1, :'lundi'::date + 7);
delete from public.affectation_roulement where id = 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2';
delete from public.salarie where id = 'f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3';
delete from public.roulement where id = 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1';
