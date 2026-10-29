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

// Aucun écran "Services" prévu dans la maquette d'origine, mais service_id
// est une FK obligatoire sur salarie/compte (on delete restrict) : sans un
// moyen de créer un service, les écrans Salariés et Utilisateurs seraient
// bloqués pour tout nouvel EHPAD. Rattaché à l'écran Utilisateurs plutôt
// qu'à Salariés (retour client du 26/09 : « les Services correspondent
// plutôt aux Utilisateurs ») — revalide aussi /admin/salaries, qui affiche
// la même liste dans son propre formulaire.
export async function creerService(_etat: EtatAction, formData: FormData): Promise<EtatAction> {
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) {
    return { error: "Le nom du service est requis." };
  }

  const supabase = await createClient();
  const { data: ehpadId } = await supabase.rpc("auth_ehpad_id");
  if (!ehpadId) {
    return { error: "Aucun établissement associé à ce compte." };
  }

  const { count } = await supabase.from("service").select("id", { count: "exact", head: true });
  const ordre = (count ?? 0) + 1;

  const { error } = await supabase
    .from("service")
    .insert({ ehpad_id: ehpadId, nom, ordre })
    .select()
    .single();

  if (error) {
    return { error: "Création du service impossible : " + error.message };
  }

  revalidatePath("/admin/utilisateurs");
  revalidatePath("/admin/salaries");
  return undefined;
}

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

  // Un utilisateur n'est jamais responsable d'un service (retour client
  // du 29/10) — le formulaire ne devrait jamais en envoyer, mais on
  // l'ignore quand même par sécurité plutôt que de laisser le trigger
  // service.responsable_id le rejeter avec une erreur peu claire.
  const servicesVoulus = donnees.typeUtilisateur === "Utilisateur" ? [] : donnees.services;
  let serviceIds: string[] = [];
  if (servicesVoulus.length > 0) {
    const { data: servicesTrouves } = await supabase
      .from("service")
      .select("id, nom, responsable_id")
      .in("nom", servicesVoulus);
    if (!servicesTrouves || servicesTrouves.length !== servicesVoulus.length) {
      return { error: "Un des services sélectionnés est introuvable." };
    }
    const dejaPris = servicesTrouves.find((s) => s.responsable_id !== null);
    if (dejaPris) {
      return { error: `Le service « ${dejaPris.nom} » a déjà un responsable — rechargez la page.` };
    }
    serviceIds = servicesTrouves.map((s) => s.id);
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
    poste: donnees.poste || null,
  });

  if (erreurCompte) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: "Création du compte impossible : " + erreurCompte.message };
  }

  if (serviceIds.length > 0) {
    const { error: erreurServices } = await admin
      .from("service")
      .update({ responsable_id: authData.user.id })
      .in("id", serviceIds);
    if (erreurServices) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return { error: "Affectation des services impossible : " + erreurServices.message };
    }
  }

  revalidatePath("/admin/utilisateurs");
  return {};
}

export async function modifierUtilisateur(id: string, donnees: Omit<Utilisateur, "id">): Promise<EtatAction> {
  if (!/^[A-Z]{3}$/.test(donnees.identifiant)) {
    return { error: "L'identifiant doit contenir exactement 3 lettres majuscules." };
  }

  const supabase = await createClient();

  const servicesVoulus = donnees.typeUtilisateur === "Utilisateur" ? [] : donnees.services;
  let serviceIds: string[] = [];
  if (servicesVoulus.length > 0) {
    const { data: servicesTrouves } = await supabase
      .from("service")
      .select("id, nom, responsable_id")
      .in("nom", servicesVoulus);
    if (!servicesTrouves || servicesTrouves.length !== servicesVoulus.length) {
      return { error: "Un des services sélectionnés est introuvable." };
    }
    const dejaPris = servicesTrouves.find((s) => s.responsable_id !== null && s.responsable_id !== id);
    if (dejaPris) {
      return { error: `Le service « ${dejaPris.nom} » a déjà un responsable — rechargez la page.` };
    }
    serviceIds = servicesTrouves.map((s) => s.id);
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
      poste: donnees.poste || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: "Mise à jour impossible : " + error.message };
  }

  // Détache d'abord tout ce que ce compte gérait, puis rattache la
  // sélection voulue — plus simple et plus sûr qu'un diff ajout/retrait,
  // notamment si le type de compte vient de changer vers Utilisateur.
  const { error: erreurDetachement } = await supabase
    .from("service")
    .update({ responsable_id: null })
    .eq("responsable_id", id);
  if (erreurDetachement) {
    return { error: "Mise à jour des services impossible : " + erreurDetachement.message };
  }

  if (serviceIds.length > 0) {
    const { error: erreurAffectation } = await supabase
      .from("service")
      .update({ responsable_id: id })
      .in("id", serviceIds);
    if (erreurAffectation) {
      return { error: "Affectation des services impossible : " + erreurAffectation.message };
    }
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
