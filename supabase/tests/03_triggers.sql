-- Triggers — cf. notes de conception (cascade, cohérence catégorie,
-- traçabilité) et migrations 0001/0004/0005/0007.

-- Cohérence catégorie ↔ code horaire référencé (roulement_jour doit
-- pointer vers un code de catégorie travail)
select test.doit_echouer(
  $$insert into public.roulement_jour (roulement_id, semaine_index, jour_semaine, code_horaire_id)
    values ('66666666-6666-6666-6666-666666666666', 0, 0, '55555555-5555-5555-5555-555555555555')$$,
  'roulement_jour refuse un code_horaire_id de catégorie informatif (attend travail)'
);

insert into public.roulement_jour (roulement_id, semaine_index, jour_semaine, code_horaire_id)
values ('66666666-6666-6666-6666-666666666666', 0, 0, '44444444-4444-4444-4444-444444444444');

select test.ok(
  (select count(*) from public.roulement_jour where roulement_id = '66666666-6666-6666-6666-666666666666') = 1,
  'roulement_jour accepte un code_horaire_id de catégorie travail'
);

-- Cascade de désactivation d'un EHPAD sur ses comptes
update public.ehpad set actif = false where id = '33333333-3333-3333-3333-333333333333';

-- Le trigger désactive TOUS les comptes de l'EHPAD, pas seulement celui
-- qu'on regarde ici (les fixtures en créent 3 : administrateur/manager/
-- utilisateur) — vérifié sur les 3, et les 3 réactivés ensuite pour ne
-- pas fausser les tests RLS suivants (04_rls.sql) qui en ont besoin actifs.
select test.ok(
  (select count(*) from public.compte
   where ehpad_id = '33333333-3333-3333-3333-333333333333' and actif = false) = 3,
  'désactiver un EHPAD désactive en cascade ses 3 comptes'
);

update public.ehpad set actif = true where id = '33333333-3333-3333-3333-333333333333';
update public.compte set actif = true where ehpad_id = '33333333-3333-3333-3333-333333333333';

-- journee_historique : trigger dédié, une ligne par changement
insert into public.journee (salarie_id, date, code_travail_id)
values ('88888888-8888-8888-8888-888888888888', '2026-09-24', '44444444-4444-4444-4444-444444444444');

update public.journee set code_travail_id = null
where salarie_id = '88888888-8888-8888-8888-888888888888' and date = '2026-09-24';

select test.ok(
  (select count(*) from public.journee_historique
   where salarie_id = '88888888-8888-8888-8888-888888888888' and date = '2026-09-24') = 2,
  'journee_historique reçoit une ligne à la création et une à la modification'
);

select test.ok(
  (select type_operation from public.journee_historique
   where salarie_id = '88888888-8888-8888-8888-888888888888' and date = '2026-09-24'
   order by horodatage asc limit 1) = 'creation',
  'journee_historique marque la 1ère ligne "creation"'
);

-- log_audit : trigger générique, alimenté à la création d'un EHPAD
select test.ok(
  (select count(*) from public.log_audit where entite = 'ehpad' and entite_id = '33333333-3333-3333-3333-333333333333') >= 1,
  'log_audit trace la création de l''EHPAD de test'
);

-- journee n'est pas dans la liste des tables auditées par le trigger
-- générique (elle a sa propre historisation dédiée, journee_historique)
select test.ok(
  (select count(*) from public.log_audit where entite = 'journee') = 0,
  'journee est exclue du trigger log_audit générique (déjà tracée par journee_historique)'
);
