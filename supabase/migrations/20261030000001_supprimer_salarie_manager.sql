-- Retire salarie.manager (retour client du 30/10) : c'était une étiquette
-- figée (Aucun / Maîtresse de maison / IDEC, cf. maquette d'origine), sans
-- lien avec aucun compte réel — d'où un formulaire de création proposant
-- des managers qui n'existaient pas pour de vrai. service.responsable_id
-- (29/10) fournit désormais la vraie réponse à « qui supervise ce
-- salarié » : chaque salarié a déjà un service_id obligatoire, le
-- responsable se déduit via service.responsable_id, sans ressaisie.
-- 0 ligne salarie en PROD au moment de cette migration (vérifié avant).

alter table public.salarie drop column manager;
