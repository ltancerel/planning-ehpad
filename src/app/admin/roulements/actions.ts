"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EtatAction = { error?: string } | undefined;

async function resoudreCodesHoraires(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ehpadId: string,
  motif: string[][]
): Promise<{ codesParId: Record<string, string>; error?: string }> {
  const codesUtilises = Array.from(
    new Set(motif.flat().filter((code): code is string => Boolean(code)))
  );
  if (codesUtilises.length === 0) return { codesParId: {} };

  const { data, error } = await supabase
    .from("code_horaire")
    .select("id, code")
    .eq("ehpad_id", ehpadId)
    .eq("categorie", "travail")
    .in("code", codesUtilises);

  if (error) {
    return { codesParId: {}, error: "Lecture des codes horaires impossible : " + error.message };
  }

  const codesParId: Record<string, string> = {};
  for (const c of data ?? []) codesParId[c.code] = c.id;

  const manquants = codesUtilises.filter((code) => !codesParId[code]);
  if (manquants.length > 0) {
    return {
      codesParId: {},
      error: `Code(s) horaire introuvable(s) parmi les codes de travail de l'établissement : ${manquants.join(", ")}.`,
    };
  }

  return { codesParId };
}

function lignesRoulementJour(roulementId: string, motif: string[][], codesParId: Record<string, string>) {
  const lignes: { roulement_id: string; semaine_index: number; jour_semaine: number; code_horaire_id: string }[] = [];
  motif.forEach((semaine, semaineIndex) => {
    semaine.forEach((code, jourIndex) => {
      if (!code) return;
      lignes.push({
        roulement_id: roulementId,
        semaine_index: semaineIndex,
        jour_semaine: jourIndex,
        code_horaire_id: codesParId[code],
      });
    });
  });
  return lignes;
}

export async function creerRoulement(
  nom: string,
  nbSemaines: number,
  motif: string[][]
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: ehpadId } = await supabase.rpc("auth_ehpad_id");
  if (!ehpadId) {
    return { error: "Aucun établissement associé à ce compte." };
  }

  const { codesParId, error: erreurCodes } = await resoudreCodesHoraires(supabase, ehpadId, motif);
  if (erreurCodes) return { error: erreurCodes };

  const { data: roulement, error } = await supabase
    .from("roulement")
    .insert({ ehpad_id: ehpadId, nom, nb_semaines: nbSemaines })
    .select("id")
    .single();
  if (error) {
    return { error: "Création impossible : " + error.message };
  }

  const lignes = lignesRoulementJour(roulement.id, motif, codesParId);
  if (lignes.length > 0) {
    const { error: erreurJours } = await supabase.from("roulement_jour").insert(lignes);
    if (erreurJours) {
      await supabase.from("roulement").delete().eq("id", roulement.id);
      return { error: "Enregistrement du motif impossible : " + erreurJours.message };
    }
  }

  revalidatePath("/admin/roulements");
  return { id: roulement.id };
}

export async function modifierRoulement(
  id: string,
  nom: string,
  nbSemaines: number,
  motif: string[][]
): Promise<EtatAction> {
  const supabase = await createClient();
  const { data: ehpadId } = await supabase.rpc("auth_ehpad_id");
  if (!ehpadId) {
    return { error: "Aucun établissement associé à ce compte." };
  }

  const { codesParId, error: erreurCodes } = await resoudreCodesHoraires(supabase, ehpadId, motif);
  if (erreurCodes) return { error: erreurCodes };

  const { error } = await supabase
    .from("roulement")
    .update({ nom, nb_semaines: nbSemaines })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    return { error: "Mise à jour impossible : " + error.message };
  }

  const { error: erreurSuppression } = await supabase.from("roulement_jour").delete().eq("roulement_id", id);
  if (erreurSuppression) {
    return { error: "Mise à jour du motif impossible : " + erreurSuppression.message };
  }

  const lignes = lignesRoulementJour(id, motif, codesParId);
  if (lignes.length > 0) {
    const { error: erreurJours } = await supabase.from("roulement_jour").insert(lignes);
    if (erreurJours) {
      return { error: "Enregistrement du motif impossible : " + erreurJours.message };
    }
  }

  revalidatePath("/admin/roulements");
  return undefined;
}

export async function supprimerRoulement(id: string): Promise<EtatAction> {
  const supabase = await createClient();
  const { error } = await supabase.from("roulement").delete().eq("id", id).select().single();

  if (error) {
    const enUsage = error.message.toLowerCase().includes("affectation_roulement");
    return {
      error: enUsage
        ? "Suppression impossible : ce roulement est encore affecté à au moins un salarié."
        : "Suppression impossible : " + error.message,
    };
  }

  revalidatePath("/admin/roulements");
  return undefined;
}
