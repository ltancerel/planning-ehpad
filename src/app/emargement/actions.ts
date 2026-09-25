"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EtatAction = { error?: string } | undefined;

export async function validerPeriode(salarieId: string, annee: number, mois: number): Promise<EtatAction> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("validation_emargement")
    .insert({ salarie_id: salarieId, annee, mois })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Cette période est déjà validée." };
    }
    return { error: "Validation impossible : " + error.message };
  }

  revalidatePath("/emargement");
  return undefined;
}
