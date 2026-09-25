"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { JourFerie } from "@/lib/mock-data";

export type EtatAction = { error?: string } | undefined;

// Le RPC generer_annee_planifiee pose l'année et les 8 jours fériés fixes +
// 3 calculés (Pâques), tous actifs — seule la suite (désactiver un jour
// calculé, ajouter un jour personnalisé) reste à réconcilier ici avec ce
// que le formulaire a produit.
async function reconcilierJoursFeries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  anneePlanifieeId: string,
  joursFeries: JourFerie[]
): Promise<string | undefined> {
  for (const jour of joursFeries.filter((j) => j.type === "calcule")) {
    const { error } = await supabase
      .from("jour_ferie")
      .update({ actif: jour.actif })
      .eq("annee_planifiee_id", anneePlanifieeId)
      .eq("type", "calcule")
      .eq("date", jour.date);
    if (error) {
      return "Mise à jour des jours fériés calculés impossible : " + error.message;
    }
  }

  // Jours fériés personnalisés : remplacement complet à chaque
  // enregistrement, même approche que pour les plages horaires ou le motif
  // d'un roulement (liste courte, plus simple qu'une synchronisation ligne
  // à ligne).
  const { error: erreurSuppression } = await supabase
    .from("jour_ferie")
    .delete()
    .eq("annee_planifiee_id", anneePlanifieeId)
    .eq("type", "personnalise");
  if (erreurSuppression) {
    return "Mise à jour des jours fériés personnalisés impossible : " + erreurSuppression.message;
  }

  const personnalises = joursFeries.filter((j) => j.type === "personnalise");
  if (personnalises.length > 0) {
    const { error } = await supabase.from("jour_ferie").insert(
      personnalises.map((j) => ({
        annee_planifiee_id: anneePlanifieeId,
        date: j.date,
        label: j.label,
        type: "personnalise",
        actif: j.actif,
      }))
    );
    if (error) {
      return "Enregistrement des jours fériés personnalisés impossible : " + error.message;
    }
  }

  return undefined;
}

export async function creerAnnee(
  annee: number,
  jourDemarrage: string,
  joursFeries: JourFerie[]
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("generer_annee_planifiee", {
    p_annee: annee,
    p_jour_demarrage: jourDemarrage,
  });
  if (error) {
    return { error: "Création impossible : " + error.message };
  }
  const anneePlanifieeId = data?.[0]?.annee_planifiee_id;
  if (!anneePlanifieeId) {
    return { error: "Création impossible : réponse inattendue du serveur." };
  }

  const erreurReconciliation = await reconcilierJoursFeries(supabase, anneePlanifieeId, joursFeries);
  if (erreurReconciliation) return { error: erreurReconciliation };

  revalidatePath("/admin/annees");
  return { id: anneePlanifieeId };
}

export async function modifierAnnee(id: string, jourDemarrage: string, joursFeries: JourFerie[]): Promise<EtatAction> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("annee_planifiee")
    .update({ jour_demarrage: jourDemarrage })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    return { error: "Mise à jour impossible : " + error.message };
  }

  const erreurReconciliation = await reconcilierJoursFeries(supabase, id, joursFeries);
  if (erreurReconciliation) return { error: erreurReconciliation };

  revalidatePath("/admin/annees");
  return undefined;
}
