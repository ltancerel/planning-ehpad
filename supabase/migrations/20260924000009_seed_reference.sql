-- Données de référence — catalogue des applications (cf. story #32).
-- Insertion en tant que rôle propriétaire de la migration (bypass RLS,
-- comportement normal d'un script de migration).

insert into public.application (code, nom) values
  ('planning', 'Planning'),
  ('qualite', 'Plan d''action qualité')
on conflict (code) do nothing;
