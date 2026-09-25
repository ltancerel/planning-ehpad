"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Utilisateur } from "@/lib/mock-data";

export type EtatAction = { error?: string } | undefined;

const TYPE_COMPTE_VERS_DB: Record<Utilisateur["typeUtilisateur"], string> = {
  Administrateur: "administrateur",
  Manager: "manager",
  Utilisateur: "utilisateur",
};

async function verifierAutorise(): Promise<{ ehpadId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data: estAdministrateurSysteme } = await supabase.rpc("est_administrateur_systeme");
  const { data: typeCompte } = await supabase.rpc("auth_type_compte");
  if (!estAdministrateurSysteme && typeCompte !== "administrateur") {
    return { error: "Réservé à l'Administrateur (ou Administrateur Système)." };
  }

  const { data: ehpadId } = await supabase.rpc("auth_ehpad_id");
  if (!ehpadId) {
    return { error: "Aucun établissement associé à ce compte." };
  }
  return { ehpadId };
}

// Pas de champ mot de passe dans ce formulaire (contrairement à la
// création du premier Administrateur d'EHPAD, cf. spec API POST
// /api/admin/ehpad) : un email d'invitation Supabase Auth permet au
// nouvel utilisateur de définir lui-même son mot de passe — cf. mock
// d'origine (« un email sera envoyé... ») et story #24 (flux
// libre-service, limites connues : SMTP intégré Supabase, 2 emails/heure
// par projet, pas de garantie de délivrabilité).
export async function creerUtilisateur(donnees: Omit<Utilisateur, "id">): Promise<{ error?: string }> {
  if (!/^[A-Z]{3}$/.test(donnees.identifiant)) {
    return { error: "L'identifiant doit contenir exactement 3 lettres majuscules." };
  }

  const autorisation = await verifierAutorise();
  if ("error" in autorisation) return autorisation;

  const supabase = await createClient();
  const { data: service } = await supabase.from("service").select("id").eq("nom", donnees.service).single();
  if (!service) {
    return { error: "Service introuvable." };
  }

  const admin = createAdminClient();

  const { data: authData, error: erreurInvitation } = await admin.auth.admin.inviteUserByEmail(donnees.email);
  if (erreurInvitation || !authData?.user) {
    return { error: "Invitation impossible : " + (erreurInvitation?.message ?? "erreur inconnue") };
  }

  const { error: erreurCompte } = await admin.from("compte").insert({
    id: authData.user.id,
    ehpad_id: autorisation.ehpadId,
    type_compte: TYPE_COMPTE_VERS_DB[donnees.typeUtilisateur],
    nom: donnees.nom,
    prenom: donnees.prenom,
    identifiant: donnees.identifiant,
    email: donnees.email,
    service_id: service.id,
    poste: donnees.poste || null,
  });

  if (erreurCompte) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: "Création du compte impossible : " + erreurCompte.message };
  }

  revalidatePath("/admin/utilisateurs");
  return {};
}

export async function modifierUtilisateur(id: string, donnees: Omit<Utilisateur, "id">): Promise<EtatAction> {
  if (!/^[A-Z]{3}$/.test(donnees.identifiant)) {
    return { error: "L'identifiant doit contenir exactement 3 lettres majuscules." };
  }

  const supabase = await createClient();
  const { data: service } = await supabase.from("service").select("id").eq("nom", donnees.service).single();
  if (!service) {
    return { error: "Service introuvable." };
  }

  // Pas de service_role nécessaire ici : mise à jour d'un compte existant,
  // couverte par la RLS "administrateur de son propre EHPAD" (générique).
  const { error } = await supabase
    .from("compte")
    .update({
      type_compte: TYPE_COMPTE_VERS_DB[donnees.typeUtilisateur],
      nom: donnees.nom,
      prenom: donnees.prenom,
      identifiant: donnees.identifiant,
      email: donnees.email,
      service_id: service.id,
      poste: donnees.poste || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: "Mise à jour impossible : " + error.message };
  }

  revalidatePath("/admin/utilisateurs");
  return undefined;
}

export async function supprimerUtilisateur(id: string): Promise<EtatAction> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === id) {
    return { error: "Impossible de supprimer votre propre compte depuis cet écran." };
  }

  const autorisation = await verifierAutorise();
  if ("error" in autorisation) return autorisation;

  // Suppression via service_role (auth.admin.deleteUser), pas un simple
  // DELETE RLS sur compte : compte.id référence auth.users.id avec cascade
  // dans CE sens (auth.users supprimé → compte supprimé), pas l'inverse —
  // supprimer seulement la ligne compte laisserait un utilisateur Auth
  // orphelin (email bloqué pour une future recréation, compte "fantôme").
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    return { error: "Suppression impossible : " + error.message };
  }

  revalidatePath("/admin/utilisateurs");
  return undefined;
}
