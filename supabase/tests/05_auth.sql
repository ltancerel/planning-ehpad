-- Résolution identifiant → email (migration 20260925000003), appelée par
-- le rôle anon avant toute authentification. Les résultats sont capturés
-- via une expression booléenne (jamais NULL) plutôt que la valeur brute,
-- pour éviter les pièges de \gset sur une colonne qui peut être NULL (la
-- variable resterait alors non définie côté psql).

set role anon;

select (public.resoudre_identifiant_email('ltancerel') = 'admin-systeme@test.local') as ok \gset auth_admin_sys_
select (public.resoudre_identifiant_email('compte-test') = 'compte-admin@test.local') as ok \gset auth_admin_
select (public.resoudre_identifiant_email('inexistant') is null) as ok \gset auth_inconnu_

reset role;

select test.ok(:'auth_admin_sys_ok'::boolean, 'résolution identifiant : administrateur_systeme actif trouvé');
select test.ok(:'auth_admin_ok'::boolean, 'résolution identifiant : compte actif trouvé');
select test.ok(:'auth_inconnu_ok'::boolean, 'résolution identifiant : identifiant inconnu renvoie NULL (pas d''énumération)');

-- Compte désactivé : ne doit plus être résolu (même NULL qu'un identifiant
-- inconnu, pour ne pas distinguer les deux cas côté appelant)
update public.compte set actif = false where identifiant = 'compte-utilisateur';

set role anon;
select (public.resoudre_identifiant_email('compte-utilisateur') is null) as ok \gset auth_desactive_
reset role;

select test.ok(:'auth_desactive_ok'::boolean, 'résolution identifiant : compte désactivé renvoie NULL');

update public.compte set actif = true where identifiant = 'compte-utilisateur';

-- authenticated (et donc PUBLIC) n'a jamais reçu ce grant : seul anon en a
-- besoin, la fonction n'a plus lieu d'être appelée après authentification.
-- Le SET ROLE se fait au niveau du script (jamais dans le corps d'une
-- fonction SECURITY DEFINER, cf. note en tête de 04_rls.sql), le bloc DO
-- ne sert qu'à capturer l'exception.
set role authenticated;

do $$
declare bloque boolean := false;
begin
  begin
    perform public.resoudre_identifiant_email('ltancerel');
  exception when insufficient_privilege then
    bloque := true;
  end;
  perform test.ok(bloque, 'résolution identifiant : authenticated n''a pas EXECUTE (grant réservé à anon)');
end $$;

reset role;
