-- RPC generer_annee_planifiee (domaine F, story #35) — cf. spécification
-- API (artifact issue #26) : crée l'année planifiée et insère les 8 jours
-- fériés fixes + les 3 dérivés de Pâques (calendrier grégorien, algorithme
-- de Meeus/Jones/Butcher). Même algorithme que src/lib/jours-feries.ts
-- côté Front End (déjà testé, e2e/jours-feries.spec.ts), porté ici pour
-- que la génération soit fiable indépendamment du client.
--
-- SECURITY INVOKER (la fonction s'exécute avec les droits de l'appelant,
-- jamais d'élévation implicite — convention actée dans la spec API) : pas
-- de vérification de rôle explicite dans le corps, l'INSERT sur
-- annee_planifiee échoue de lui-même (insufficient_privilege) si
-- l'appelant n'est ni administrateur_systeme ni administrateur de cet
-- EHPAD (policies déjà posées en migration 0008). ehpad_id n'est donc pas
-- un paramètre : toujours résolu depuis auth_ehpad_id(), jamais choisi par
-- l'appelant.

create or replace function public.calculer_paques(p_annee integer)
returns date
language plpgsql
immutable
as $$
declare
  a int := p_annee % 19;
  b int := p_annee / 100;
  c int := p_annee % 100;
  d int := b / 4;
  e int := b % 4;
  f int := (b + 8) / 25;
  g int := (b - f + 1) / 3;
  h int := (19 * a + b - d - g + 15) % 30;
  i int := c / 4;
  k int := c % 4;
  l int := (32 + 2 * e + 2 * i - h - k) % 7;
  m int := (a + 11 * h + 22 * l) / 451;
  v_mois int := (h + l - 7 * m + 114) / 31;
  v_jour int := ((h + l - 7 * m + 114) % 31) + 1;
begin
  return make_date(p_annee, v_mois, v_jour);
end;
$$;

create or replace function public.generer_annee_planifiee(p_annee integer, p_jour_demarrage date)
returns table (annee_planifiee_id uuid, jours_feries_crees integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_annee_planifiee_id uuid;
  v_paques date;
  v_compteur integer := 0;
  v_fixe record;
begin
  insert into public.annee_planifiee (ehpad_id, annee, jour_demarrage)
  values (public.auth_ehpad_id(), p_annee, p_jour_demarrage)
  returning id into v_annee_planifiee_id;

  for v_fixe in
    select * from (values
      (1, 1, 'Jour de l''An'),
      (1, 5, 'Fête du Travail'),
      (8, 5, 'Victoire 1945'),
      (14, 7, 'Fête nationale'),
      (15, 8, 'Assomption'),
      (1, 11, 'Toussaint'),
      (11, 11, 'Armistice'),
      (25, 12, 'Noël')
    ) as t(jour, mois, label)
  loop
    insert into public.jour_ferie (annee_planifiee_id, date, label, type)
    values (v_annee_planifiee_id, make_date(p_annee, v_fixe.mois, v_fixe.jour), v_fixe.label, 'fixe');
    v_compteur := v_compteur + 1;
  end loop;

  v_paques := public.calculer_paques(p_annee);

  insert into public.jour_ferie (annee_planifiee_id, date, label, type) values
    (v_annee_planifiee_id, v_paques + 1, 'Lundi de Pâques', 'calcule'),
    (v_annee_planifiee_id, v_paques + 39, 'Ascension', 'calcule'),
    (v_annee_planifiee_id, v_paques + 50, 'Lundi de Pentecôte', 'calcule');
  v_compteur := v_compteur + 3;

  return query select v_annee_planifiee_id, v_compteur;
end;
$$;
