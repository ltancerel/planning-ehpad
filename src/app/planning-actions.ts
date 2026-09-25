"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ValeurCellule } from "@/lib/horaire-codes";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type LigneJournee = { salarieId: string; dateISO: string; valeur: ValeurCellule };
export type CelluleJournee = { salarieId: string; dateISO: string };

// Charge les cases réellement planifiées sur une plage de dates — appelé
// côté client (PlanningGrid, Émargement) à chaque changement de fenêtre
// affichée, pas côté serveur au premier rendu : la période initiale dépend
// de préférences mémorisées en localStorage (cf. commentaire dans
// PlanningGrid), donc jamais connue avant l'hydratation côté client.
export async function chargerPlanningReel(
  dateDebut: string,
  dateFin: string,
  salarieId?: string
): Promise<{ planning?: Record<string, ValeurCellule>; error?: string }> {
  const supabase = await createClient();

  let requete = supabase
    .from("journee")
    .select(
      "salarie_id, date, code_travail:code_travail_id(code), code_informatif:code_informatif_id(code), code_evenementiel:code_evenementiel_id(code), journee_evenementiel_plage(heure_debut, heure_fin, ordre)"
    )
    .gte("date", dateDebut)
    .lte("date", dateFin);
  if (salarieId) {
    requete = requete.eq("salarie_id", salarieId);
  }

  const { data, error } = await requete;
  if (error) {
    return { error: "Lecture du planning impossible : " + error.message };
  }

  const planning: Record<string, ValeurCellule> = {};
  for (const j of data ?? []) {
    planning[`${j.salarie_id}__${j.date}`] = {
      travail: j.code_travail?.code,
      informatif: j.code_informatif?.code,
      evenementiel: j.code_evenementiel?.code,
      evenementielPlages: j.journee_evenementiel_plage.length
        ? [...j.journee_evenementiel_plage]
            .sort((a, b) => a.ordre - b.ordre)
            .map((p) => ({ debut: p.heure_debut.slice(0, 5), fin: p.heure_fin.slice(0, 5) }))
        : undefined,
    };
  }

  return { planning };
}

async function resoudreCodesUtilises(
  supabase: SupabaseClient,
  ehpadId: string,
  codes: string[]
): Promise<{ codesParId: Record<string, string>; error?: string }> {
  if (codes.length === 0) return { codesParId: {} };

  const { data, error } = await supabase
    .from("code_horaire")
    .select("id, code")
    .eq("ehpad_id", ehpadId)
    .in("code", codes);
  if (error) {
    return { codesParId: {}, error: "Lecture des codes horaires impossible : " + error.message };
  }

  const codesParId: Record<string, string> = {};
  for (const c of data ?? []) codesParId[c.code] = c.id;

  const manquants = codes.filter((code) => !codesParId[code]);
  if (manquants.length > 0) {
    return {
      codesParId: {},
      error: `Code(s) horaire introuvable(s) parmi les codes de l'établissement : ${manquants.join(", ")}.`,
    };
  }

  return { codesParId };
}

// Enregistre une ou plusieurs cases déjà fusionnées côté client
// (fusionnerCode, cf. PlanningGrid) : une seule case (édition simple) ou
// plusieurs (application groupée sur une sélection) — chaque ligne porte sa
// propre valeur finale, car l'état de départ (déjà un travail ou non) peut
// différer d'une case à l'autre dans une sélection.
export async function enregistrerJournees(lignes: LigneJournee[]): Promise<{ error?: string }> {
  if (lignes.length === 0) return {};

  const supabase = await createClient();
  const { data: ehpadId } = await supabase.rpc("auth_ehpad_id");
  if (!ehpadId) {
    return { error: "Aucun établissement associé à ce compte." };
  }

  const codesUtilises = Array.from(
    new Set(
      lignes.flatMap((l) => [l.valeur.travail, l.valeur.informatif, l.valeur.evenementiel]).filter(
        (c): c is string => Boolean(c)
      )
    )
  );
  const { codesParId, error: erreurCodes } = await resoudreCodesUtilises(supabase, ehpadId, codesUtilises);
  if (erreurCodes) return { error: erreurCodes };

  const rows = lignes.map((l) => ({
    salarie_id: l.salarieId,
    date: l.dateISO,
    code_travail_id: l.valeur.travail ? codesParId[l.valeur.travail] : null,
    code_informatif_id: l.valeur.informatif ? codesParId[l.valeur.informatif] : null,
    code_evenementiel_id: l.valeur.evenementiel ? codesParId[l.valeur.evenementiel] : null,
  }));

  const { data: journeesEcrites, error } = await supabase
    .from("journee")
    .upsert(rows, { onConflict: "salarie_id,date" })
    .select("id, salarie_id, date");
  if (error) {
    return { error: "Enregistrement impossible : " + error.message };
  }
  if ((journeesEcrites?.length ?? 0) !== rows.length) {
    return { error: "Enregistrement refusé : droits insuffisants sur au moins une case." };
  }

  // Remplacement complet des plages événementielles "partiel" par case
  // concernée — même approche que pour les plages horaires d'un code, plus
  // simple qu'une synchronisation ligne à ligne.
  for (const ligne of lignes) {
    const journeeRow = journeesEcrites!.find((j) => j.salarie_id === ligne.salarieId && j.date === ligne.dateISO);
    if (!journeeRow) continue;

    const { error: erreurSuppression } = await supabase
      .from("journee_evenementiel_plage")
      .delete()
      .eq("journee_id", journeeRow.id);
    if (erreurSuppression) {
      return { error: "Enregistrement des plages impossible : " + erreurSuppression.message };
    }

    if (ligne.valeur.evenementielPlages && ligne.valeur.evenementielPlages.length > 0) {
      const plagesRows = ligne.valeur.evenementielPlages.map((p, i) => ({
        journee_id: journeeRow.id,
        ordre: i + 1,
        heure_debut: p.debut,
        heure_fin: p.fin,
      }));
      const { error: erreurPlages } = await supabase.from("journee_evenementiel_plage").insert(plagesRows);
      if (erreurPlages) {
        return { error: "Enregistrement des plages impossible : " + erreurPlages.message };
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/emargement");
  return {};
}

// Efface une ou plusieurs cases (remise en "jamais planifiée", pas juste
// vidée — cf. commentaire dans PlanningGrid). Le filtre OR porte sur des
// paires (salarie_id, date) précises : salarieId vient toujours d'un
// salarié réel déjà résolu (props chargées depuis la base) et dateISO d'un
// formatage interne déterministe, jamais de texte libre saisi par
// l'utilisateur — construire le filtre par concaténation est donc sûr ici.
export async function effacerJournees(cellules: CelluleJournee[]): Promise<{ error?: string }> {
  if (cellules.length === 0) return {};

  const supabase = await createClient();
  const filtre = cellules.map((c) => `and(salarie_id.eq.${c.salarieId},date.eq.${c.dateISO})`).join(",");

  const { data, error } = await supabase.from("journee").delete().or(filtre).select("id");
  if (error) {
    return { error: "Suppression impossible : " + error.message };
  }
  if (cellules.length === 1 && (data?.length ?? 0) === 0) {
    return { error: "Suppression refusée : droits insuffisants ou case déjà vide." };
  }

  revalidatePath("/");
  revalidatePath("/emargement");
  return {};
}
