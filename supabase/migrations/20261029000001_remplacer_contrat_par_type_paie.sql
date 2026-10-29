-- Remplace le concept de "contrat" (CDI/CDD historisé dans une table
-- séparée, un seul actif à la fois) par un champ "type de paie" simple,
-- directement sur salarie — retour client du 29/10 : la notion de contrat
-- actif/inactif ne correspondait pas au besoin réel, un type de paie à 3
-- valeurs suffit (25/M, 30/M, Aucun). Suppression sans risque de perte de
-- données : 0 ligne dans contrat au moment de cette migration (vérifié
-- avant application, cf. BACKLOG).
drop table public.contrat;

alter table public.salarie
  add column type_paie text not null default 'Aucun' check (type_paie in ('25/M', '30/M', 'Aucun'));
