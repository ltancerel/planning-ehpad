-- Retire code_horaire.action (retour client du 12/11) : c'était un texte
-- libre, saisi à la création d'un code évènementiel (valeur par défaut
-- "Se superpose au code horaire"), jamais affiché nulle part ailleurs
-- dans l'application (ni tableau des codes, ni sélecteur de code du
-- planning, ni émargement) — une note interne jamais branchée à l'écran.
-- 0 valeur non nulle en PROD au moment de cette migration (vérifié avant).

alter table public.code_horaire drop column action;
