-- Résolution identifiant → email pour la connexion (story #33, issue #33).
-- La connexion à l'application se fait par « identifiant » (cf. modèle de
-- données, unicité garantie tous comptes confondus par le trigger de la
-- migration 0001), pas par email — Supabase Auth n'authentifie que par
-- email. Cette fonction fait le pont côté base, appelée avant toute
-- authentification (donc par le rôle anon), sans exposer d'autre colonne
-- que l'email et sans distinguer identifiant inconnu / compte désactivé
-- (NULL dans les deux cas) — le Front End traite l'absence de résultat
-- comme « identifiant ou mot de passe incorrect », message générique, pour
-- ne pas permettre l'énumération des identifiants valides.

create or replace function public.resoudre_identifiant_email(p_identifiant text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select email from public.compte where identifiant = p_identifiant and actif
  union all
  select email from public.administrateur_systeme where identifiant = p_identifiant and actif
  limit 1;
$$;

revoke execute on function public.resoudre_identifiant_email(text) from public;
grant execute on function public.resoudre_identifiant_email(text) to anon;
