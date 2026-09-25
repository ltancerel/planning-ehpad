-- Repéré par get_advisors juste après l'application de la migration
-- précédente (20260925000006) : calculer_paques n'avait pas de
-- search_path fixé (lint "Function Search Path Mutable"), contrairement à
-- la convention déjà suivie par les autres fonctions du dépôt.
create or replace function public.calculer_paques(p_annee integer)
returns date
language plpgsql
immutable
set search_path = public
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
