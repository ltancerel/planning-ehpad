"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EtatConnexion = { error?: string } | undefined;

// Supabase Auth répond déjà de façon générique (ne distingue pas email
// inconnu / mot de passe incorrect) : pas besoin de logique maison ici,
// contrairement à l'ancienne résolution identifiant→email.
const ERREUR_GENERIQUE = "Email ou mot de passe incorrect.";

export async function login(
  _etat: EtatConnexion,
  formData: FormData
): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");

  if (!email || !motDePasse) {
    return { error: "Email et mot de passe requis." };
  }

  const supabase = await createClient();

  const { error: erreurConnexion } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  if (erreurConnexion) {
    return { error: ERREUR_GENERIQUE };
  }

  redirect("/compte");
}
