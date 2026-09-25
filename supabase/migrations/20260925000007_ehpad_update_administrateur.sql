-- Correctif : l'écran Identité EHPAD (/admin/ehpad, branché le 25/09,
-- story #34/#35) est destiné à l'Administrateur de l'EHPAD lui-même, mais
-- la policy UPDATE sur ehpad n'a jamais autorisé que administrateur_systeme
-- (migration 0008, jamais élargie depuis). Bug réel détecté après un test
-- manuel : upload d'un logo silencieusement non enregistré — RLS filtre
-- l'UPDATE sans lever d'erreur PostgREST, la requête « réussit » avec 0
-- ligne affectée. Élargit l'UPDATE à l'administrateur de son propre
-- établissement, même principe que les tables ehpad_id-scoped génériques
-- (migration hardening).

alter policy "modification ehpad par administrateur systeme" on public.ehpad
  using (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur' and id = (select public.auth_ehpad_id()))
  )
  with check (
    (select public.est_administrateur_systeme())
    or ((select public.auth_type_compte()) = 'administrateur' and id = (select public.auth_ehpad_id()))
  );
