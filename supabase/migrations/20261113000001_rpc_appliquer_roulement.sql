-- RPC appliquer_roulement (domaine D/E, story #35) — dernier incrément du
-- branchement de la grille Planning sur le vrai backend (retour client du
-- 12/11 : « il ne faut plus aucun truc de démo »). Jusqu'ici le raccourci
-- « Appliquer le roulement » (case vide, ou action groupée sur une
-- sélection mono-jour) lisait des données de démo (ROULEMENTS_DEMO/
-- AFFECTATIONS_ROULEMENT_DEMO) et n'écrivait jamais en base — tout
-- disparaissait au rechargement de la page.
--
-- SECURITY INVOKER (même convention que generer_annee_planifiee) : pas de
-- vérification de rôle explicite dans le corps, les écritures sur journee
-- échouent d'elles-mêmes (RLS déjà posée, administrateur ET manager) si
-- l'appelant n'a pas les droits. affectation_roulement et roulement_jour ne
-- sont lus qu'en SELECT, déjà couverts par les policies de lecture scopées
-- à l'EHPAD de l'appelant.
--
-- Règle "tout ou rien" (retour client du 17/09, déjà implémentée côté
-- maquette dans evaluerProjectionRoulement/PlanningGrid.tsx, reproduite
-- ici à l'identique côté serveur pour éviter une double source de vérité
-- et fermer la fenêtre de concurrence d'une vérification faite seulement
-- côté client) : si une seule des semaines du motif à appliquer contient
-- déjà un code de travail, rien n'est écrit, et la semaine bloquante est
-- renvoyée pour affichage. semaine_depart (retour client du 22/09) permet
-- de ne pas repartir systématiquement de la semaine 1 du motif.
--
-- Traçabilité (cf. note « Traçabilité des fonctions RPC », Modèle de
-- données domaine G) : journee est exclue du trigger générique
-- tracer_log_audit, donc une ligne de synthèse est insérée ici
-- explicitement (entite = 'roulement'). Le trigger tracer_journee_historique
-- lit en priorité le paramètre de session app.type_operation : positionné
-- ici à 'application_roulement' avant les écritures, plutôt que de laisser
-- la valeur déduite par défaut de TG_OP ('creation'/'modification').
--
-- log_audit n'a volontairement aucune policy d'écriture pour authenticated
-- (seules les fonctions de confiance y écrivent, cf. tracer_log_audit) :
-- une fonction SECURITY INVOKER comme appliquer_roulement ne peut donc pas
-- y insérer directement. inserer_log_audit() isole cette unique insertion
-- derrière une fonction SECURITY DEFINER dédiée (même principe que
-- tracer_log_audit, dont elle reprend la résolution d'acteur), réutilisable
-- par toute future fonction RPC dans le même cas — cf. « Règle générale
-- pour toute future fonction RPC » du Modèle de données domaine G.
create or replace function public.inserer_log_audit(
  p_ehpad_id uuid,
  p_type_operation text,
  p_entite text,
  p_entite_id uuid,
  p_source text,
  p_message text,
  p_detail jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_acteur_type text;
  v_acteur_nom text;
begin
  select type_compte, (nom || ' ' || prenom) into v_acteur_type, v_acteur_nom
  from public.compte where id = auth.uid();

  if not found then
    select 'administrateur_systeme', (nom || ' ' || prenom) into v_acteur_type, v_acteur_nom
    from public.administrateur_systeme where id = auth.uid();
  end if;

  if not found then
    v_acteur_type := 'service';
    v_acteur_nom := 'service';
  end if;

  insert into public.log_audit (
    ehpad_id, compte_id_auteur, acteur_type, acteur_nom, type_operation,
    entite, entite_id, source, message, detail
  )
  values (
    p_ehpad_id, auth.uid(), v_acteur_type, v_acteur_nom, p_type_operation,
    p_entite, p_entite_id, p_source, p_message, p_detail
  );
end;
$$;

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
        and code_travail_id is not null
    ) then
      return query select false, p_lundi_debut + (v_semaine * 7);
      return;
    end if;
  end loop;

  perform set_config('app.type_operation', 'application_roulement', true);

  for v_semaine in 0..v_nb_a_appliquer - 1 loop
    for v_jour in 0..6 loop
      v_date := p_lundi_debut + (v_semaine * 7) + v_jour;
      select code_horaire_id into v_code_id
      from public.roulement_jour
      where roulement_id = v_roulement_id
        and semaine_index = v_index_depart + v_semaine
        and jour_semaine = v_jour;

      if v_code_id is not null then
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
