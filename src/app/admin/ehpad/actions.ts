"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EtatIdentite = { error?: string; ok?: boolean } | undefined;

export async function mettreAJourIdentiteEhpad(
  _etat: EtatIdentite,
  formData: FormData
): Promise<EtatIdentite> {
  const nom = String(formData.get("nom") ?? "").trim();
  const logoBrut = formData.get("logo_base64");
  const logoBase64 = typeof logoBrut === "string" && logoBrut.length > 0 ? logoBrut : null;

  if (!nom) {
    return { error: "Le nom de l'EHPAD est requis." };
  }

  const supabase = await createClient();
  const { data: ehpadId } = await supabase.rpc("auth_ehpad_id");

  if (!ehpadId) {
    return { error: "Aucun établissement associé à ce compte." };
  }

  // .select().single() plutôt qu'un simple .update() : sans ça, une RLS qui
  // filtre silencieusement la ligne (UPDATE "réussit" avec 0 ligne affectée,
  // pas d'erreur PostgREST) passait inaperçue — bug réel détecté le 25/09
  // avec l'upload d'un logo jamais enregistré. .single() échoue
  // explicitement si aucune ligne n'a été mise à jour.
  const { error } = await supabase
    .from("ehpad")
    .update({ nom, logo_base64: logoBase64 })
    .eq("id", ehpadId)
    .select()
    .single();

  if (error) {
    return { error: "Enregistrement impossible : " + error.message };
  }

  revalidatePath("/admin/ehpad");
  revalidatePath("/");
  return { ok: true };
}
