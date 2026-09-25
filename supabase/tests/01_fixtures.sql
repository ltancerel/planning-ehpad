-- Données de base réutilisées par les fichiers de tests suivants : un
-- administrateur système, un EHPAD, un compte administrateur, un service,
-- un salarié, deux codes horaires (travail + informatif) et un roulement.

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin-systeme@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'compte-admin@test.local'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'compte-manager@test.local'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'compte-utilisateur@test.local');

insert into public.administrateur_systeme (id, nom, prenom, identifiant, email)
values ('11111111-1111-1111-1111-111111111111', 'Tancerel', 'Ludovic', 'ltancerel', 'admin-systeme@test.local');

insert into public.ehpad (id, nom) values ('33333333-3333-3333-3333-333333333333', 'EHPAD Test');

insert into public.compte (id, ehpad_id, type_compte, nom, prenom, identifiant, email) values
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'administrateur', 'Test', 'Test', 'compte-test', 'compte-admin@test.local'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'manager', 'Manager', 'Test', 'compte-manager', 'compte-manager@test.local'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'utilisateur', 'Utilisateur', 'Test', 'compte-utilisateur', 'compte-utilisateur@test.local');

insert into public.service (id, ehpad_id, nom, ordre)
values ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'IDE', 1);

insert into public.salarie (id, ehpad_id, service_id, matricule, nom, prenom, presence)
values ('88888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'M001', 'Dupont', 'Marie', 'Présent');

insert into public.code_horaire (id, ehpad_id, code, intitule, couleur_fond, couleur_texte, categorie)
values
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '70A', 'Matin', '#fff', '#000', 'travail'),
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'CP', 'Congé', '#fff', '#000', 'informatif');

insert into public.roulement (id, ehpad_id, nom, nb_semaines)
values ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'Roulement A', 1);

select test.ok(
  (select count(*) from public.compte where ehpad_id = '33333333-3333-3333-3333-333333333333') = 3,
  'fixtures : les 3 comptes (administrateur/manager/utilisateur) sont bien créés'
);
