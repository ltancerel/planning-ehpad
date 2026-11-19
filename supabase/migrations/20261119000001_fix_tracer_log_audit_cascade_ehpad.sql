-- Corrige la suppression d'un EHPAD, impossible depuis l'écran
-- Administrateur Système dès que l'EHPAD a des données liées (retour
-- client du 19/11) :
--   "Suppression impossible : insert or update on table "log_audit"
--    violates foreign key constraint "log_audit_ehpad_id_fkey""
--
-- Cause : tracer_log_audit() (20260924000007) est posé sur ehpad, service,
-- compte, salarie, roulement, code_horaire, annee_planifiee et
-- ehpad_application. Supprimer un EHPAD déclenche la cascade "on delete
-- cascade" de son FK (service_ehpad_id_fkey, compte_ehpad_id_fkey, etc.)
-- sur toutes ces tables liées — chacune de ces suppressions en cascade
-- déclenche à son tour tracer_log_audit(), qui tente d'insérer une ligne
-- de log référençant l'ehpad_id de l'EHPAD... déjà supprimé à cet instant
-- (la ligne ehpad a disparu avant que ces triggers en cascade ne
-- s'exécutent). log_audit.ehpad_id a bien "on delete set null" (migration
-- 20260924000007 ligne 20), mais cette clause ne protège que les lignes
-- déjà existantes au moment de la suppression, pas une toute nouvelle
-- ligne insérée après coup avec cet ehpad_id devenu orphelin.
--
-- Corrigé en vérifiant, juste avant l'insertion, que l'EHPAD référencé
-- existe encore ; sinon ehpad_id est mis à null dans la ligne d'audit —
-- exactement le même comportement que "on delete set null" applique déjà
-- aux lignes existantes, appliqué ici par anticipation. Le reste de la
-- traçabilité (quelle entité, quelle opération) n'est pas perdu, seul le
-- rattachement à l'EHPAD manque pour ces lignes précises.
create or replace function public.tracer_log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ligne jsonb := to_jsonb(coalesce(NEW, OLD));
  ehpad_ref uuid;
  acteur_type_val text;
  acteur_nom_val text;
begin
  if ligne ? 'ehpad_id' then
    ehpad_ref := (ligne ->> 'ehpad_id')::uuid;
  end if;

  if ehpad_ref is not null and not exists (select 1 from public.ehpad where id = ehpad_ref) then
    ehpad_ref := null;
  end if;

  select type_compte, (nom || ' ' || prenom) into acteur_type_val, acteur_nom_val
  from public.compte where id = auth.uid();

  if not found then
    select 'administrateur_systeme', (nom || ' ' || prenom) into acteur_type_val, acteur_nom_val
    from public.administrateur_systeme where id = auth.uid();
  end if;

  if not found then
    acteur_type_val := 'service';
    acteur_nom_val := 'service';
  end if;

  insert into public.log_audit (
    ehpad_id, compte_id_auteur, acteur_type, acteur_nom, type_operation, entite, entite_id, source, message
  )
  values (
    ehpad_ref,
    auth.uid(),
    acteur_type_val,
    acteur_nom_val,
    case TG_OP
      when 'INSERT' then 'creation'
      when 'UPDATE' then 'modification'
      when 'DELETE' then 'effacement'
    end,
    TG_TABLE_NAME,
    (ligne ->> 'id')::uuid,
    'Planning',
    format('%s sur %s', TG_OP, TG_TABLE_NAME)
  );

  return coalesce(NEW, OLD);
end;
$$;
