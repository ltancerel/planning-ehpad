"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EtatConnexion = { error?: string } | undefined;

// Message générique volontairement identique pour identifiant inconnu,
// compte désactivé et mot de passe incorrect : ne jamais laisser deviner
// lequel des trois est en cause (cf. supabase/migrations/20260925000003).
const ERREUR_GENERIQUE = "Identifiant ou mot de passe incorrect.";

export async function login(
  _etat: EtatConnexion,
  formData: FormData
): Promise<EtatConnexion> {
  const identifiant = String(formData.get("identifiant") ?? "").trim();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");

  if (!identifiant || !motDePasse) {
    return { error: "Identifiant et mot de passe requis." };
  }

  const supabase = await createClient();

  const { data: email } = await supabase.rpc("resoudre_identifiant_email", {
    p_identifiant: identifiant,
  });

  if (!email) {
    return { error: ERREUR_GENERIQUE };
  }

  const { error: erreurConnexion } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  if (erreurConnexion) {
    return { error: ERREUR_GENERIQUE };
  }

  redirect("/compte");
}
