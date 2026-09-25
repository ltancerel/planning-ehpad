"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EtatEhpad = { error?: string } | undefined;

// RLS (policies "ecriture ehpad par administrateur systeme" / "suppression
// ehpad par administrateur systeme", migration 20260924000008/hardening)
// réserve déjà l'insert/delete à administrateur_systeme : pas de vérif de
// rôle ici, la base refuse elle-même l'opération sinon (insufficient_privilege).

export async function creerEhpad(_etat: EtatEhpad, formData: FormData): Promise<EtatEhpad> {
  const nom = String(formData.get("nom") ?? "").trim();

  if (!nom) {
    return { error: "Le nom de l'EHPAD est requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ehpad").insert({ nom });

  if (error) {
    return { error: "Création impossible : " + error.message };
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
