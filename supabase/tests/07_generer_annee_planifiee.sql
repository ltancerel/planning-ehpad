-- RPC generer_annee_planifiee (migration 20260925000006, story #35).

-- 1) un compte administrateur peut générer une année planifiée pour son
--    EHPAD : 8 jours fériés fixes + 3 dérivés de Pâques
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select * from public.generer_annee_planifiee(2027, '2027-01-01') \gset genere_
reset role;
reset request.jwt.claim.sub;

select test.ok(:genere_jours_feries_crees = 11, 'generer_annee_planifiee : crée 11 jours fériés (8 fixes + 3 calculés)');

select count(*) as n from public.jour_ferie where annee_planifiee_id = :'genere_annee_planifiee_id' and type = 'fixe' \gset annee2027_fixes_
select count(*) as n from public.jour_ferie where annee_planifiee_id = :'genere_annee_planifiee_id' and type = 'calcule' \gset annee2027_calcules_

select test.ok(:annee2027_fixes_n = 8, 'generer_annee_planifiee : 8 jours fériés fixes créés');
select test.ok(:annee2027_calcules_n = 3, 'generer_annee_planifiee : 3 jours fériés calculés créés');

-- Cohérence interne : le Lundi de Pâques inséré correspond bien à
-- calculer_paques(2027) + 1 (les deux fonctions doivent s'accorder)
select exists (
  select 1 from public.jour_ferie
  where annee_planifiee_id = :'genere_annee_planifiee_id'
    and label = 'Lundi de Pâques'
    and date = public.calculer_paques(2027) + 1
) as ok \gset paques_coherente_

select test.ok(:'paques_coherente_ok'::boolean, 'generer_annee_planifiee : Lundi de Pâques cohérent avec calculer_paques()');

-- 2) un compte manager (pas administrateur) ne peut pas générer d'année
--    planifiée — bloqué par la RLS sur l'INSERT dans annee_planifiee, la
--    fonction elle-même ne vérifie aucun rôle
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

do $$
declare bloque boolean := false;
begin
  begin
    perform public.generer_annee_planifiee(2028, '2028-01-01');
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'generer_annee_planifiee : un compte manager ne peut pas générer d''année planifiée');
end $$;

reset role;
reset request.jwt.claim.sub;

-- 3) une deuxième année planifiée pour le même EHPAD et la même année
--    échoue (contrainte unique ehpad_id/annee, déjà posée en migration
--    0006) — la fonction ne doit pas masquer cette erreur
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$
declare bloque boolean := false;
begin
  begin
    perform public.generer_annee_planifiee(2027, '2027-01-01');
  exception when unique_violation then
    bloque := true;
  end;
  perform test.ok(bloque, 'generer_annee_planifiee : refuse une deuxième année planifiée identique (contrainte unique)');
end $$;

reset role;
reset request.jwt.claim.sub;
