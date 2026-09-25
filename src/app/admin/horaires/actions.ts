"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { HoraireCode } from "@/lib/horaire-codes";

export type EtatAction = { error?: string } | undefined;

// Les 4 CHECK de cohérence categorie/type_evenement/duree_heures sont déjà
// posés en base (migration domaine C) : pas revalidés ici, la base les
// applique de toute façon — une incohérence renvoie une erreur Postgres
// claire plutôt qu'un silence.
export async function enregistrerCodeHoraire(
  id: string | undefined,
  code: HoraireCode
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: ehpadId } = await supabase.rpc("auth_ehpad_id");
  if (!ehpadId) {
    return { error: "Aucun établissement associé à ce compte." };
  }

  const donnees = {
    ehpad_id: ehpadId,
    code: code.code,
    intitule: code.intitule,
    categorie: code.categorie,
    couleur_fond: code.couleurFond,
    couleur_texte: code.couleurTexte,
    commentaire: code.commentaire ?? null,
    afficher_vue_annuelle: code.afficherVueAnnuelle ?? false,
    action: code.categorie === "evenementiel" ? (code.action ?? null) : null,
    type_evenement: code.categorie === "evenementiel" ? code.typeEvenement : null,
    duree_heures: code.categorie === "evenementiel" && code.typeEvenement === "normal" ? code.duree : null,
  };

  let codeHoraireId = id;

  if (id) {
    const { error } = await supabase.from("code_horaire").update(donnees).eq("id", id).select().single();
    if (error) {
      return { error: "Mise à jour impossible : " + error.message };
    }
    // Remplacement complet des plages (au plus 4) plutôt qu'une
    // synchronisation ligne à ligne — plus simple et sans risque
    // d'incohérence d'ordre pour un maximum de 4 lignes.
    const { error: erreurSuppression } = await supabase.from("plage_horaire").delete().eq("code_horaire_id", id);
    if (erreurSuppression) {
      return { error: "Mise à jour des plages impossible : " + erreurSuppression.message };
    }
  } else {
    const { data, error } = await supabase.from("code_horaire").insert(donnees).select("id").single();
    if (error) {
      return { error: "Création impossible : " + error.message };
    }
    codeHoraireId = data.id;
  }

  if (code.categorie === "travail" && code.plages && code.plages.length > 0) {
    const lignes = code.plages.slice(0, 4).map((plage, index) => ({
      code_horaire_id: codeHoraireId!,
      ordre: index + 1,
      heure_debut: plage.debut,
      heure_fin: plage.fin,
    }));
    const { error } = await supabase.from("plage_horaire").insert(lignes);
    if (error) {
      return { error: "Enregistrement des plages impossible : " + error.message };
    }
  }

  revalidatePath("/admin/horaires");
  return { id: codeHoraireId };
}

export async function supprimerCodeHoraire(id: string): Promise<EtatAction> {
  const supabase = await createClient();
  const { error } = await supabase.from("code_horaire").delete().eq("id", id).select().single();

  if (error) {
    return { error: "Suppression impossible : " + error.message };
  }

  revalidatePath("/admin/horaires");
  return undefined;
}
