-- inserer_log_audit (durcie dans 20261113000002) : un appel RPC direct
-- (hors appliquer_roulement) avec un ehpad_id qui n'est pas celui de
-- l'appelant doit être refusé — cf. note de la migration. Réutilise
-- l'EHPAD « Autre » créé par 02_contraintes.sql
-- (33333333-3333-3333-3333-333333333339) comme établissement étranger.

set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$
declare refuse boolean := false;
begin
  begin
    perform public.inserer_log_audit(
      '33333333-3333-3333-3333-333333333339'::uuid,
      'modification', 'roulement', null, 'Planning', 'tentative hors périmètre', null
    );
  exception when others then
    refuse := true;
  end;
  perform test.ok(refuse, 'inserer_log_audit : refuse un ehpad_id étranger au compte appelant');
end $$;

select count(*) as n from public.log_audit
where entite = 'roulement' and message = 'tentative hors périmètre' \gset hors_perimetre_
select test.ok(:hors_perimetre_n = 0, 'inserer_log_audit : aucune ligne écrite lors du refus');

select public.inserer_log_audit(
  '33333333-3333-3333-3333-333333333333'::uuid,
  'modification', 'roulement', null, 'Planning', 'tentative dans son propre ehpad', null
);

select count(*) as n from public.log_audit
where entite = 'roulement' and message = 'tentative dans son propre ehpad' \gset propre_ehpad_
select test.ok(:propre_ehpad_n = 1, 'inserer_log_audit : autorise le compte appelant sur son propre ehpad');

reset role;
reset request.jwt.claim.sub;

delete from public.log_audit where message in ('tentative hors périmètre', 'tentative dans son propre ehpad');
