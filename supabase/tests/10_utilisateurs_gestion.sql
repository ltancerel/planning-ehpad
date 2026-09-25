-- Gestion des comptes (écran /admin/utilisateurs, story #34/#35). La
-- création réelle passe par service_role (utilisateur Supabase Auth,
-- comme le premier Administrateur d'EHPAD) et n'est donc pas testable ici
-- (pas de vrai GoTrue en local) — seule la RLS sur la table compte
-- elle-même est vérifiée : INSERT/UPDATE déjà dans le groupe générique
-- tables_ehpad_admin (migration 0008), jamais testée à l'écriture avant
-- cet écran.

-- 1) un administrateur peut créer un compte pour son EHPAD (en local,
--    sans passer par l'Auth réel — la fonction serveur, elle, passe
--    toujours par service_role + auth.admin.inviteUserByEmail)
insert into auth.users (id, email) values ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'nouveau-compte@test.local');

set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.compte (id, ehpad_id, type_compte, nom, prenom, identifiant, email)
values ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', '33333333-3333-3333-3333-333333333333', 'utilisateur', 'Nouveau', 'Compte', 'NCO', 'nouveau-compte@test.local');
select count(*) as n from public.compte where id = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1' \gset compte_cree_
reset role;
reset request.jwt.claim.sub;

select test.ok(:compte_cree_n = 1, 'gestion utilisateurs : un administrateur peut créer un compte pour son EHPAD');

-- 2) un administrateur peut modifier un compte de son EHPAD (ex. poste)
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
update public.compte set poste = 'Poste modifié' where id = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
select poste from public.compte where id = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1' \gset compte_modifie_
reset role;
reset request.jwt.claim.sub;

select test.ok(:'compte_modifie_poste' = 'Poste modifié', 'gestion utilisateurs : un administrateur peut modifier un compte de son EHPAD');

-- 3) un manager ne peut pas créer de compte
insert into auth.users (id, email) values ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'refuse@test.local');

set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

do $$
declare bloque boolean := false;
begin
  begin
    insert into public.compte (id, ehpad_id, type_compte, nom, prenom, identifiant, email)
    values ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', '33333333-3333-3333-3333-333333333333', 'utilisateur', 'Refuse', 'Test', 'REF', 'refuse@test.local');
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'gestion utilisateurs : un manager ne peut pas créer de compte');
end $$;

reset role;
reset request.jwt.claim.sub;

-- 4) un manager ne peut pas modifier le compte créé au point 1
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
update public.compte set poste = 'Modifié par manager' where id = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
select poste from public.compte where id = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1' \gset compte_inchange_
reset role;
reset request.jwt.claim.sub;

select test.ok(:'compte_inchange_poste' = 'Poste modifié', 'gestion utilisateurs : un manager ne peut pas modifier un compte (RLS filtre silencieusement, UPDATE 0 ligne)');
