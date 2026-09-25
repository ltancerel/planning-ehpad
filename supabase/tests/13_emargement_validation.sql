-- Validation de l'émargement (écran /emargement, story #35) : RLS sur
-- validation_emargement jamais testée à l'écriture avant cet écran —
-- écriture ouverte à administrateur ET manager (contrairement au groupe
-- générique tables_ehpad_admin, administrateur seul), cf. migration
-- 20260925000001_rls_hardening. Réutilise le salarié de fixture
-- '88888888-8888-8888-8888-888888888888' (ehpad 33333333...).

-- 1) un administrateur peut valider une période (mois) pour un salarié de
--    son EHPAD
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.validation_emargement (salarie_id, annee, mois)
values ('88888888-8888-8888-8888-888888888888', 2026, 9);
select count(*) as n from public.validation_emargement where salarie_id = '88888888-8888-8888-8888-888888888888' and annee = 2026 and mois = 9 \gset validation_admin_
reset role;
reset request.jwt.claim.sub;

select test.ok(:validation_admin_n = 1, 'validation émargement : un administrateur peut valider une période pour un salarié de son EHPAD');

-- 2) un manager peut aussi valider une période (mois différent, pour ne
--    pas se heurter à la contrainte unique du test précédent)
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
insert into public.validation_emargement (salarie_id, annee, mois)
values ('88888888-8888-8888-8888-888888888888', 2026, 10);
select count(*) as n from public.validation_emargement where salarie_id = '88888888-8888-8888-8888-888888888888' and annee = 2026 and mois = 10 \gset validation_manager_
reset role;
reset request.jwt.claim.sub;

select test.ok(:validation_manager_n = 1, 'validation émargement : un manager peut aussi valider une période');

-- 3) un compte utilisateur (ni administrateur ni manager) ne peut pas
--    valider de période
set role authenticated;
set request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

do $$
declare bloque boolean := false;
begin
  begin
    insert into public.validation_emargement (salarie_id, annee, mois)
    values ('88888888-8888-8888-8888-888888888888', 2026, 11);
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'validation émargement : un compte utilisateur ne peut pas valider de période');
end $$;

reset role;
reset request.jwt.claim.sub;

-- 4) valider deux fois la même période (même salarié/année/mois) échoue —
--    contrainte unique déjà posée en migration 0005, jamais exercée à
--    l'écriture avant cet écran
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$
declare bloque boolean := false;
begin
  begin
    insert into public.validation_emargement (salarie_id, annee, mois)
    values ('88888888-8888-8888-8888-888888888888', 2026, 9);
  exception when unique_violation then
    bloque := true;
  end;
  perform test.ok(bloque, 'validation émargement : refuse de valider deux fois la même période (contrainte unique)');
end $$;

reset role;
reset request.jwt.claim.sub;
