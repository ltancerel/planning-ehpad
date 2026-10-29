-- Un administrateur ou un manager peut être responsable de plusieurs
-- services ; un service a au plus un responsable, administrateur OU
-- manager, exclusivement — retour client du 29/10. Remplace
-- compte.service_id (affectation d'un seul service par compte, tout type
-- confondu) par service.responsable_id, sens inverse : un même compte
-- peut être référencé par plusieurs services, mais un compte utilisateur
-- ne peut jamais l'être, et chaque service ne pointe que vers un seul
-- compte à la fois (simple colonne, pas de table de liaison nécessaire).

alter table public.service
  add column responsable_id uuid references public.compte (id) on delete set null;

create index service_responsable_id_idx on public.service (responsable_id);

-- Un CHECK ne peut pas vérifier une colonne d'une autre table : la
-- cohérence type_compte du responsable est donc garantie par trigger,
-- même principe que les autres règles inter-tables de ce modèle
-- (catégorie de code horaire, identifiant global avant le 29/10...).
create or replace function public.verifier_responsable_service()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if NEW.responsable_id is not null then
    if not exists (
      select 1 from public.compte
      where id = NEW.responsable_id and type_compte in ('administrateur', 'manager')
    ) then
      raise exception 'service.responsable_id doit référencer un compte administrateur ou manager';
    end if;
  end if;
  return NEW;
end;
$$;

create trigger verifier_responsable_service_trigger
before insert or update of responsable_id on public.service
for each row execute function public.verifier_responsable_service();

-- Migration des données existantes (1 ligne en PROD au moment d'écrire
-- cette migration : compte administrateur VHO -> service Direction).
update public.service s
set responsable_id = c.id
from public.compte c
where c.service_id = s.id and c.type_compte in ('administrateur', 'manager');

alter table public.compte drop column service_id;
