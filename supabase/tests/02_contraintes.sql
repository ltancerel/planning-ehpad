-- Contraintes CHECK et unicité — cf. notes de conception du modèle de
-- données (domaines A, C, E) et migrations 0001/0003/0005.

insert into auth.users (id, email) values ('99999999-9999-9999-9999-999999999999', 'x2@test.local');

select test.doit_echouer(
  $$insert into public.compte (id, ehpad_id, type_compte, nom, prenom, identifiant, email)
    values ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 'superadmin', 'X', 'X', 'x-compte', 'x@test.local')$$,
  'compte.type_compte rejette une valeur hors administrateur/manager/utilisateur'
);

-- compte.identifiant : unique par établissement seulement depuis le 29/10
-- (migration 20261029000002), plus globalement — la résolution
-- identifiant→email qui justifiait l'unicité globale a disparu dès le
-- 25/09 (login par email natif Supabase Auth, cf. migration
-- 20260925000005_drop_resoudre_identifiant).
insert into public.compte (id, ehpad_id, type_compte, nom, prenom, identifiant, email)
values ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 'administrateur', 'X', 'X', 'ltancerel', 'x2@test.local');
select test.ok(
  (select count(*) from public.compte where id = '99999999-9999-9999-9999-999999999999') = 1,
  'compte.identifiant accepte désormais un identifiant déjà pris par administrateur_systeme'
);
delete from public.compte where id = '99999999-9999-9999-9999-999999999999';

insert into auth.users (id, email) values ('99999999-9999-9999-9999-999999999998', 'x3@test.local');
insert into public.ehpad (id, nom) values ('33333333-3333-3333-3333-333333333339', 'EHPAD Autre');
insert into public.compte (id, ehpad_id, type_compte, nom, prenom, identifiant, email)
values ('99999999-9999-9999-9999-999999999998', '33333333-3333-3333-3333-333333333339', 'administrateur', 'X', 'X', 'compte-test', 'x3@test.local');
select test.ok(
  (select count(*) from public.compte where id = '99999999-9999-9999-9999-999999999998') = 1,
  'compte.identifiant accepte désormais un identifiant déjà pris dans un autre établissement'
);
delete from public.compte where id = '99999999-9999-9999-9999-999999999998';
delete from public.ehpad where id = '33333333-3333-3333-3333-333333333339';

select test.doit_echouer(
  $$insert into public.compte (id, ehpad_id, type_compte, nom, prenom, identifiant, email)
    values ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 'administrateur', 'X', 'X', 'compte-test', 'x2@test.local')$$,
  'compte.identifiant reste rejeté s''il est déjà pris dans le même établissement'
);

select test.doit_echouer(
  $$insert into public.code_horaire (ehpad_id, code, intitule, couleur_fond, couleur_texte, categorie)
    values ('33333333-3333-3333-3333-333333333333', 'EVT1', 'Test', '#fff', '#000', 'evenementiel')$$,
  'code_horaire evenementiel sans type_evenement est rejeté'
);

select test.doit_echouer(
  $$insert into public.code_horaire (ehpad_id, code, intitule, couleur_fond, couleur_texte, categorie, type_evenement, duree_heures)
    values ('33333333-3333-3333-3333-333333333333', 'EVT2', 'Test', '#fff', '#000', 'evenementiel', 'special', 2.5)$$,
  'code_horaire type_evenement=special avec duree_heures est rejeté'
);

select test.doit_echouer(
  $$insert into public.code_horaire (ehpad_id, code, intitule, couleur_fond, couleur_texte, categorie, type_evenement)
    values ('33333333-3333-3333-3333-333333333333', 'EVT3', 'Test', '#fff', '#000', 'evenementiel', 'normal')$$,
  'code_horaire type_evenement=normal sans duree_heures est rejeté'
);

-- journee : composition d'une case (2 CHECK, cf. migration 0005)
select test.doit_echouer(
  $$insert into public.journee (salarie_id, date, code_evenementiel_id)
    values ('88888888-8888-8888-8888-888888888888', '2026-01-01', '44444444-4444-4444-4444-444444444444')$$,
  'journee refuse un code evenementiel sans code travail'
);

-- salarie.type_paie : 3 valeurs possibles seulement (cf. migration
-- 20261029000001, remplace l'ancien concept de contrat CDI/CDD)
select test.doit_echouer(
  $$insert into public.salarie (ehpad_id, service_id, matricule, nom, prenom, presence, type_paie)
    values ('33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'ZPAI', 'Test', 'Paie', 'Présent', 'autre')$$,
  'salarie.type_paie rejette une valeur hors 25/M, 30/M, Aucun'
);

-- service.responsable_id : administrateur ou manager exclusivement
-- (migration 20261029000003, remplace compte.service_id) — un compte
-- utilisateur n'a jamais de service, un manager/administrateur peut en
-- avoir plusieurs (simple colonne sur service, pas de table de liaison).
select test.doit_echouer(
  $$update public.service set responsable_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    where id = '77777777-7777-7777-7777-777777777777'$$,
  'service.responsable_id rejette un compte utilisateur'
);

update public.service set responsable_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
where id = '77777777-7777-7777-7777-777777777777';
select test.ok(
  (select responsable_id from public.service where id = '77777777-7777-7777-7777-777777777777')
    = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'service.responsable_id accepte un compte manager'
);

insert into public.service (id, ehpad_id, nom, ordre)
values ('77777777-7777-7777-7777-777777777779', '33333333-3333-3333-3333-333333333333', 'Cuisine', 2);
update public.service set responsable_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
where id = '77777777-7777-7777-7777-777777777779';
select test.ok(
  (select count(*) from public.service where responsable_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = 2,
  'service.responsable_id : un même manager peut être responsable de plusieurs services'
);

-- nettoyage, pour ne pas perturber les tests suivants
update public.service set responsable_id = null
where id in ('77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777779');
delete from public.service where id = '77777777-7777-7777-7777-777777777779';
