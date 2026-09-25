-- Édition des cases du Planning (story #35, écran /) : journee elle-même
-- (RLS écriture administrateur + manager) est déjà testée dans 04_rls.sql
-- et sa traçabilité (journee_historique) dans 03_triggers.sql. Seule
-- journee_evenementiel_plage (les plages horaires d'un code évènementiel
-- "partiel" saisi à la volée) n'avait encore aucune assertion à
-- l'écriture. Réutilise la journee de fixture posée par 04_rls.sql
-- (salarié '88888888-...', date '2026-10-01').

-- 1) un administrateur peut ajouter une plage à une case existante
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.journee_evenementiel_plage (journee_id, ordre, heure_debut, heure_fin)
select id, 1, '16:00', '20:00' from public.journee where salarie_id = '88888888-8888-8888-8888-888888888888' and date = '2026-10-01';
select count(*) as n from public.journee_evenementiel_plage jep
  join public.journee j on j.id = jep.journee_id
  where j.salarie_id = '88888888-8888-8888-8888-888888888888' and j.date = '2026-10-01' \gset plage_creee_
reset role;
reset request.jwt.claim.sub;

select test.ok(:plage_creee_n = 1, 'journee_evenementiel_plage : un administrateur peut ajouter une plage à une case');

-- 2) un manager peut aussi ajouter une plage (le manager peut modifier le
--    planning, même droit que sur journee elle-même)
set role authenticated;
set request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
insert into public.journee_evenementiel_plage (journee_id, ordre, heure_debut, heure_fin)
select id, 2, '05:00', '06:00' from public.journee where salarie_id = '88888888-8888-8888-8888-888888888888' and date = '2026-10-01';
select count(*) as n from public.journee_evenementiel_plage jep
  join public.journee j on j.id = jep.journee_id
  where j.salarie_id = '88888888-8888-8888-8888-888888888888' and j.date = '2026-10-01' \gset plages_apres_manager_
reset role;
reset request.jwt.claim.sub;

select test.ok(:plages_apres_manager_n = 2, 'journee_evenementiel_plage : un manager peut aussi ajouter une plage');

-- 3) un compte utilisateur ne peut pas ajouter de plage (lecture seule)
set role authenticated;
set request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

do $$
declare bloque boolean := false;
begin
  begin
    insert into public.journee_evenementiel_plage (journee_id, ordre, heure_debut, heure_fin)
    select id, 3, '12:00', '13:00' from public.journee where salarie_id = '88888888-8888-8888-8888-888888888888' and date = '2026-10-01';
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'journee_evenementiel_plage : un compte utilisateur ne peut pas ajouter de plage');
end $$;

reset role;
reset request.jwt.claim.sub;

-- 4) un administrateur peut supprimer les plages d'une case (remplacement
--    complet, même approche applicative que pour les plages horaires d'un
--    code ou le motif d'un roulement)
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
delete from public.journee_evenementiel_plage
  where journee_id in (select id from public.journee where salarie_id = '88888888-8888-8888-8888-888888888888' and date = '2026-10-01');
select count(*) as n from public.journee_evenementiel_plage jep
  join public.journee j on j.id = jep.journee_id
  where j.salarie_id = '88888888-8888-8888-8888-888888888888' and j.date = '2026-10-01' \gset plages_supprimees_
reset role;
reset request.jwt.claim.sub;

select test.ok(:plages_supprimees_n = 0, 'journee_evenementiel_plage : un administrateur peut supprimer les plages d''une case');
