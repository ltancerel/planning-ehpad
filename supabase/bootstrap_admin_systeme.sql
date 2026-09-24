-- Amorçage du tout premier Administrateur Système (story #33, issue #33).
-- À exécuter UNE SEULE FOIS, à la main, dans l'éditeur SQL du dashboard
-- Supabase — après avoir créé l'utilisateur Supabase Auth correspondant
-- (Authentication > Users > Add user). Pas une migration : elle dépend
-- d'un UUID connu seulement après cette étape manuelle (cf. supabase/README.md).
--
-- Remplacer <UUID_AUTH_USER> par l'id copié depuis Authentication > Users.

insert into public.administrateur_systeme (id, nom, prenom, identifiant, email)
values (
  '<UUID_AUTH_USER>',
  'Tancerel',
  'Ludovic',
  'ltancerel',
  'ludovic.tancerel@aiot-conseil.fr'
);

-- Vérification
select * from public.administrateur_systeme;
