-- Autorise les codes informatifs (en plus de travail) dans un motif de
-- roulement (retour client du 13/11) — jusqu'ici roulement_jour.code_horaire_id
-- n'acceptait que la catégorie travail (trigger posé le 24/09, domaine D).
--
-- verifier_categorie_code_horaire() généralise à une LISTE de catégories
-- acceptées (TG_ARGV[1] devient une chaîne séparée par des virgules,
-- ex. 'travail,informatif') plutôt qu'une seule — rétrocompatible avec les
-- 3 triggers de journee (domaine E), qui continuent de passer une seule
-- catégorie ('travail'/'informatif'/'evenementiel' chacun) et se comportent
-- donc exactement comme avant.
create or replace function public.verifier_categorie_code_horaire()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  colonne text := TG_ARGV[0];
  categories_attendues text[] := string_to_array(TG_ARGV[1], ',');
  code_id uuid;
  categorie_reelle text;
begin
  code_id := (to_jsonb(NEW) ->> colonne)::uuid;
  if code_id is null then
    return NEW;
  end if;
  select categorie into categorie_reelle from public.code_horaire where id = code_id;
  if categorie_reelle is null or not (categorie_reelle = any (categories_attendues)) then
    raise exception '% doit référencer un code_horaire de catégorie % (trouvé %)',
      colonne, array_to_string(categories_attendues, ' ou '), categorie_reelle;
  end if;
  return NEW;
end;
$$;

-- TG_ARGV est figé à la création du trigger : il faut le recréer pour
-- changer son argument, "create or replace function" seul ne suffit pas.
drop trigger verifier_categorie_roulement_jour on public.roulement_jour;

create trigger verifier_categorie_roulement_jour
before insert or update of code_horaire_id on public.roulement_jour
for each row execute function public.verifier_categorie_code_horaire('code_horaire_id', 'travail,informatif');

-- appliquer_roulement (migration 20261113000001) doit maintenant :
-- 1) bloquer (règle "tout ou rien") si code_travail_id OU code_informatif_id
--    est déjà posé sur un jour de la semaine visée — jusqu'ici seul
--    code_travail_id était vérifié, un jour "informatif seul" existant
--    aurait pu être écrasé silencieusement par le roulement.
-- 2) écrire le code résolu dans la colonne journee correspondant à sa
--    catégorie réelle (travail -> code_travail_id, informatif ->
--    code_informatif_id), plutôt que toujours code_travail_id.
create or replace function public.appliquer_roulement(
  p_salarie_id uuid,
  p_lundi_debut date,
  p_semaine_depart integer default 1
)
returns table (applique boolean, semaine_bloquee date)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_roulement_id uuid;
  v_nb_semaines integer;
  v_index_depart integer;
  v_nb_a_appliquer integer;
  v_semaine integer;
  v_jour integer;
  v_date date;
  v_code_id uuid;
  v_categorie text;
  v_journee_id uuid;
begin
  select roulement_id into v_roulement_id
  from public.affectation_roulement
  where salarie_id = p_salarie_id
    and date_debut <= current_date
    and (date_fin is null or date_fin >= current_date)
  order by date_debut desc
  limit 1;

  if v_roulement_id is null then
    return query select false, null::date;
    return;
  end if;

  select nb_semaines into v_nb_semaines from public.roulement where id = v_roulement_id;
  if v_nb_semaines is null then
    -- roulement_id référencé par l'affectation mais invisible en lecture
    -- (RLS d'un autre EHPAD, ou supprimé) : traité comme "sans roulement".
    return query select false, null::date;
    return;
  end if;

  v_index_depart := least(greatest(p_semaine_depart - 1, 0), v_nb_semaines - 1);
  v_nb_a_appliquer := v_nb_semaines - v_index_depart;

  for v_semaine in 0..v_nb_a_appliquer - 1 loop
    if exists (
      select 1 from public.journee
      where salarie_id = p_salarie_id
        and date between p_lundi_debut + (v_semaine * 7) and p_lundi_debut + (v_semaine * 7) + 6
        and (code_travail_id is not null or code_informatif_id is not null)
    ) then
      return query select false, p_lundi_debut + (v_semaine * 7);
      return;
    end if;
  end loop;

  perform set_config('app.type_operation', 'application_roulement', true);

  for v_semaine in 0..v_nb_a_appliquer - 1 loop
    for v_jour in 0..6 loop
      v_date := p_lundi_debut + (v_semaine * 7) + v_jour;
      select rj.code_horaire_id, ch.categorie into v_code_id, v_categorie
      from public.roulement_jour rj
      left join public.code_horaire ch on ch.id = rj.code_horaire_id
      where rj.roulement_id = v_roulement_id
        and rj.semaine_index = v_index_depart + v_semaine
        and rj.jour_semaine = v_jour;

      if v_code_id is not null and v_categorie = 'informatif' then
        insert into public.journee (salarie_id, date, code_informatif_id)
        values (p_salarie_id, v_date, v_code_id)
        on conflict (salarie_id, date) do update set code_informatif_id = excluded.code_informatif_id
        returning id into v_journee_id;
      elsif v_code_id is not null then
        insert into public.journee (salarie_id, date, code_travail_id)
        values (p_salarie_id, v_date, v_code_id)
        on conflict (salarie_id, date) do update set code_travail_id = excluded.code_travail_id
        returning id into v_journee_id;
      else
        -- Jour de repos du motif : remet la case à zéro (comportement déjà
        -- actuel côté maquette — poser un repos efface aussi un éventuel
        -- informatif/évènementiel résiduel de la case, plutôt que de ne
        -- toucher qu'au travail).
        insert into public.journee (salarie_id, date, code_travail_id, code_informatif_id, code_evenementiel_id)
        values (p_salarie_id, v_date, null, null, null)
        on conflict (salarie_id, date) do update
          set code_travail_id = null, code_informatif_id = null, code_evenementiel_id = null
        returning id into v_journee_id;

        delete from public.journee_evenementiel_plage where journee_id = v_journee_id;
      end if;
    end loop;
  end loop;

  perform public.inserer_log_audit(
    (select s.ehpad_id from public.salarie s where s.id = p_salarie_id),
    'application_roulement',
    'roulement',
    v_roulement_id,
    'Planning',
    format('Roulement appliqué au salarié %s à partir du %s', p_salarie_id, p_lundi_debut),
    jsonb_build_object(
      'salarie_id', p_salarie_id, 'date_debut', p_lundi_debut, 'semaine_depart', p_semaine_depart
    )
  );

  return query select true, null::date;
end;
$$;
