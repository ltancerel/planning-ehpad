-- Relâche l'unicité globale de compte.identifiant en unicité par
-- établissement (retour client du 29/10, suite à une erreur bloquante à la
-- création d'un vrai EHPAD : l'administratrice y figurait déjà sur l'EHPAD
-- de test avec le même identifiant 3 lettres).
--
-- La justification initiale de l'unicité globale (cf. note de conception
-- « identifiant : unique tous comptes confondus, garanti par trigger ») ne
-- tient plus : elle servait à résoudre sans ambiguïté un identifiant en
-- email pour la connexion, mécanisme retiré le 25/09 au profit du login
-- natif Supabase Auth par email (cf. migration
-- 20260925000005_drop_resoudre_identifiant.sql). `identifiant` reste un
-- champ produit (code 3 lettres, affiché sur l'écran Admin > Utilisateurs)
-- : seule une collision au sein d'un même établissement crée une
-- confusion réelle à l'écran — deux établissements différents peuvent
-- désormais réutiliser le même identifiant.
drop trigger verifier_identifiant_unique_compte on public.compte;
drop trigger verifier_identifiant_unique_administrateur_systeme on public.administrateur_systeme;
drop function public.verifier_identifiant_unique_global();

alter table public.compte drop constraint compte_identifiant_key;
alter table public.compte add constraint compte_identifiant_ehpad_key unique (ehpad_id, identifiant);
