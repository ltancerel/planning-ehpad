-- Complète la migration précédente (rls_hardening) : PostgreSQL accorde
-- EXECUTE à PUBLIC automatiquement à la création d'une fonction, et ce
-- droit n'est PAS retiré par un simple `revoke ... from anon` ou
-- `from authenticated` — tout rôle continue d'en hériter via PUBLIC tant
-- que PUBLIC lui-même n'est pas révoqué. Vérifié après application de la
-- migration précédente sur PROD (get_advisors continuait de signaler les
-- 6 fonctions comme exécutables par anon/authenticated malgré le revoke
-- ciblé) : requête sur information_schema.routine_privileges a confirmé
-- la présence du grant PUBLIC résiduel.
--
-- Les 3 fonctions utilitaires doivent garder un accès `authenticated`
-- (les policies RLS les appellent). Sur le projet PROD, `authenticated`
-- avait déjà un grant explicite séparé — pas posé par nos migrations,
-- mais par une convention propre à la plateforme Supabase
-- (`ALTER DEFAULT PRIVILEGES` appliqué à la création du projet). S'appuyer
-- dessus implicitement serait fragile (rien ne garantit cette convention
-- ailleurs, ni qu'elle perdure) : le grant est donc posé ici explicitement
-- par la migration elle-même, qui devient autosuffisante — détecté par la
-- suite de tests locale, qui ne reproduit pas cette convention Supabase et
-- a donc révélé la dépendance implicite.
--
-- Les 2 fonctions de trigger n'ont besoin d'aucun grant applicatif : leur
-- retirer PUBLIC ferme l'accès RPC direct pour tout le monde, sans
-- affecter le déclenchement des triggers eux-mêmes (indépendant des
-- droits EXECUTE du rôle qui fait le DML).

revoke execute on function public.est_administrateur_systeme() from public;
revoke execute on function public.auth_ehpad_id() from public;
revoke execute on function public.auth_type_compte() from public;
revoke execute on function public.tracer_journee_historique() from public;
revoke execute on function public.tracer_log_audit() from public;

grant execute on function public.est_administrateur_systeme() to authenticated;
grant execute on function public.auth_ehpad_id() to authenticated;
grant execute on function public.auth_type_compte() to authenticated;
