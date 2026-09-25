-- Retire la résolution identifiant→email (migrations 20260925000003 et
-- 20260925000004) : la connexion utilise finalement le mécanisme natif de
-- Supabase Auth (email direct), plus simple et sans code à maintenir côté
-- base — Supabase Auth répond déjà de façon générique (« Invalid login
-- credentials ») sans distinguer email inconnu / mot de passe incorrect,
-- ce que la RPC ne faisait que reproduire manuellement.
--
-- `identifiant` reste un champ produit à part entière (code 3 lettres,
-- déjà maquetté sur les écrans Admin > Utilisateurs et vraisemblablement
-- la grille Planning) : rien ne change de ce côté, seule la connexion
-- n'en dépend plus.

drop function if exists public.resoudre_identifiant_email(text);
