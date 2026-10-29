-- Contraintes CHECK et unicité — cf. notes de conception du modèle de
-- données (domaines A, C, E) et migrations 0001/0003/0005.

insert into auth.users (id, email) values ('99999999-9999-9999-9999-999999999999', 'x2@test.local');

select test.doit_echouer(
  $$insert into public.compte (id, ehpad_id, type_compte, nom, prenom, identifiant, email)
    values ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 'superadmin', 'X', 'X', 'x-compte', 'x@test.local')$$,
  'compte.type_compte rejette une valeur hors administrateur/manager/utilisateur'
);

select test.doit_echouer(
  $$insert into public.compte (id, ehpad_id, type_compte, nom, prenom, identifiant, email)
    values ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 'administrateur', 'X', 'X', 'ltancerel', 'x2@test.local')$$,
  'compte.identifiant rejette un identifiant déjà pris par administrateur_systeme'
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
