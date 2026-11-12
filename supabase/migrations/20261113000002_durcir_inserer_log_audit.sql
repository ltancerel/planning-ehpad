-- Durcit inserer_log_audit() (ajoutée dans 20261113000001) : l'audit
-- sécurité PROD (get_advisors) a immédiatement signalé qu'une fonction
-- SECURITY DEFINER qui écrit (insert) est exposée nommément en RPC
-- PostgREST à authenticated — contrairement à auth_ehpad_id()/
-- auth_type_compte()/est_administrateur_systeme(), qui ne font que lire
-- l'identité de l'appelant et ne risquent donc rien à être appelées
-- directement. Sans garde-fou, n'importe quel compte authentifié (même
-- type_compte = utilisateur, lecture seule partout ailleurs) pouvait
-- appeler /rest/v1/rpc/inserer_log_audit directement avec un p_ehpad_id
-- arbitraire — y compris celui d'un AUTRE établissement — et y forger une
-- ligne de log_audit. acteur_type/acteur_nom restent fiables (résolus
-- depuis auth.uid(), jamais fournis par l'appelant), mais rien ne bornait
-- jusqu'ici l'établissement concerné.
--
-- appliquer_roulement n'appelle jamais cette fonction qu'avec le
-- p_ehpad_id réel du salarié qu'il vient de modifier — toujours celui du
-- compte appelant, puisque les écritures sur journee qui précèdent cet
-- appel ont elles-mêmes déjà réussi sous RLS (scopée à l'EHPAD de
-- l'appelant). Le garde-fou ci-dessous ne restreint donc en rien l'usage
-- réel de la fonction, seul un appel RPC direct et hors-périmètre devient
-- impossible.
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
  if p_ehpad_id is not null
     and p_ehpad_id is distinct from public.auth_ehpad_id()
     and not public.est_administrateur_systeme() then
    raise exception 'inserer_log_audit : ehpad_id ne correspond pas au compte appelant';
  end if;

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
