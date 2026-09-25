-- Complète la migration précédente (resoudre_identifiant) : comme déjà
-- rencontré sur les fonctions RLS (migration revoke_public_execute),
-- Supabase accorde automatiquement EXECUTE à `authenticated` sur toute
-- nouvelle fonction du schéma public (convention de plateforme non
-- documentée, `ALTER DEFAULT PRIVILEGES` posé à la création du projet) —
-- indépendamment des GRANT explicites de la migration. Vérifié après coup
-- via information_schema.routine_privileges : authenticated y figurait
-- alors que seul anon avait été accordé explicitement.
--
-- resoudre_identifiant_email n'a de sens qu'avant authentification (elle
-- sert justement à résoudre l'identifiant en email pour se connecter) :
-- un compte déjà authentifié n'a aucune raison légitime de l'appeler,
-- contrairement aux fonctions utilitaires RLS (auth_ehpad_id, etc.) qui
-- ont besoin d'un accès authenticated explicite.

revoke execute on function public.resoudre_identifiant_email(text) from authenticated;
