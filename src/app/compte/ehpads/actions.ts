"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { motDePasseValide } from "@/lib/mot-de-passe";

export type EtatEhpad = { error?: string } | undefined;

// Création atomique (EHPAD + premier compte Administrateur, cf. spec API
// POST /api/admin/ehpad, issue #26) : nécessite service_role pour créer
// l'utilisateur Supabase Auth — impossible via un simple insert RLS,
// contrairement à la création d'EHPAD seule d'avant cette évolution.
// « Tout-ou-rien » best-effort (pas de vraie transaction cross Postgres/Auth
// possible) : toute étape en échec nettoie ce qui a déjà été créé.
export async function creerEhpad(_etat: EtatEhpad, formData: FormData): Promise<EtatEhpad> {
  const nom = String(formData.get("nom") ?? "").trim();
  const adminNom = String(formData.get("admin_nom") ?? "").trim();
  const adminPrenom = String(formData.get("admin_prenom") ?? "").trim();
  const adminIdentifiant = String(formData.get("admin_identifiant") ?? "").trim().toUpperCase();
  const adminEmail = String(formData.get("admin_email") ?? "").trim();
  const adminMotDePasse = String(formData.get("admin_mot_de_passe") ?? "");

  if (!nom) {
    return { error: "Le nom de l'EHPAD est requis." };
  }
  if (!adminNom || !adminPrenom || !adminEmail) {
    return { error: "Les informations du premier administrateur sont requises." };
  }
  if (!/^[A-Z]{3}$/.test(adminIdentifiant)) {
    return { error: "L'identifiant de l'administrateur doit contenir exactement 3 lettres." };
  }
  if (!motDePasseValide(adminMotDePasse)) {
    return {
      error:
        "Le mot de passe de l'administrateur ne respecte pas les règles (8 caractères min., un caractère spécial, indicateur de robustesse au vert).",
    };
  }

  // Vérifié AVANT toute écriture : le client ci-dessous (service_role)
  // contourne la RLS, donc rien ne l'empêcherait sinon — réservé à
  // l'Administrateur Système (spec API).
  const supabaseAppelant = await createClient();
  const {
    data: { user },
  } = await supabaseAppelant.auth.getUser();
  if (!user) {
    return { error: "Non connecté." };
  }
  const { data: estAdministrateurSysteme } = await supabaseAppelant.rpc("est_administrateur_systeme");
  if (!estAdministrateurSysteme) {
    return { error: "Réservé à l'Administrateur Système." };
  }

  const admin = createAdminClient();

  const { data: ehpad, error: erreurEhpad } = await admin.from("ehpad").insert({ nom }).select("id").single();

  if (erreurEhpad || !ehpad) {
    return { error: "Création de l'EHPAD impossible : " + (erreurEhpad?.message ?? "erreur inconnue") };
  }

  const { data: authData, error: erreurAuth } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminMotDePasse,
    email_confirm: true,
  });

  if (erreurAuth || !authData?.user) {
    await admin.from("ehpad").delete().eq("id", ehpad.id);
    return { error: "Création du compte administrateur impossible : " + (erreurAuth?.message ?? "erreur inconnue") };
  }

  const { error: erreurCompte } = await admin.from("compte").insert({
    id: authData.user.id,
    ehpad_id: ehpad.id,
    type_compte: "administrateur",
    nom: adminNom,
    prenom: adminPrenom,
    identifiant: adminIdentifiant,
    email: adminEmail,
  });

  if (erreurCompte) {
    await admin.auth.admin.deleteUser(authData.user.id);
    await admin.from("ehpad").delete().eq("id", ehpad.id);
    return { error: "Création du compte administrateur impossible : " + erreurCompte.message };
  }

  revalidatePath("/compte/ehpads");
}

export async function supprimerEhpad(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("ehpad").delete().eq("id", id);

  if (error) {
    return { error: "Suppression impossible : " + error.message };
  }

  revalidatePath("/compte/ehpads");
  return {};
}
