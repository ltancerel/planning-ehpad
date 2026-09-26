"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EtatAction = { error?: string } | undefined;

// La création de service se fait désormais depuis l'écran Utilisateurs
// (retour client du 26/09 : « les Services correspondent plutôt aux
// Utilisateurs »), cf. src/app/admin/utilisateurs/actions.ts. Cet écran
// continue de lire la liste des services (FK obligatoire sur salarie),
// juste sans pouvoir en créer.

export type ChampsSalarie = {
  matricule: string;
  nom: string;
  prenom: string;
  serviceId: string;
  typeContrat: "CDI" | "CDD";
  contratActif: boolean;
  manager: string;
  alignementRoulement: string;
  presence: "Présent" | "Absent";
};

// « Passer actif à faux renseigne date_fin dans la même requête » (spec
// API, issue #26) : géré ici, côté formulaire — clôt l'ancien contrat actif
// (date_fin = aujourd'hui) avant d'en ouvrir un nouveau si besoin, jamais
// deux contrats actifs à la fois (index unique partiel déjà posé en base).
export async function enregistrerSalarie(
  id: string | undefined,
  champs: ChampsSalarie
): Promise<{ error?: string }> {
  if (!/^[A-Z]{4}$/.test(champs.matricule)) {
    return { error: "Le matricule doit contenir exactement 4 lettres majuscules." };
  }
  if (!champs.nom.trim() || !champs.prenom.trim()) {
    return { error: "Le nom et le prénom sont obligatoires." };
  }

  const supabase = await createClient();
  const { data: ehpadId } = await supabase.rpc("auth_ehpad_id");
  if (!ehpadId) {
    return { error: "Aucun établissement associé à ce compte." };
  }

  const donneesSalarie = {
    ehpad_id: ehpadId,
    service_id: champs.serviceId,
    matricule: champs.matricule,
    nom: champs.nom.trim().toUpperCase(),
    prenom: champs.prenom.trim(),
    manager: champs.manager || null,
    alignement_roulement: champs.alignementRoulement || null,
    presence: champs.presence,
  };

  let salarieId = id;

  // .select().single() partout : détecte un 0-ligne-affectée (RLS qui
  // filtre silencieusement) au lieu de rapporter un faux succès — même
  // piège que le bug identité EHPAD du 25/09 (migration 20260925000007).
  if (id) {
    const { error } = await supabase.from("salarie").update(donneesSalarie).eq("id", id).select().single();
    if (error) {
      return { error: "Mise à jour du salarié impossible : " + error.message };
    }
  } else {
    const { data, error } = await supabase.from("salarie").insert(donneesSalarie).select("id").single();
    if (error) {
      return { error: "Création du salarié impossible : " + error.message };
    }
    salarieId = data.id;
  }

  const { data: contratActuel } = await supabase
    .from("contrat")
    .select("id, type_contrat")
    .eq("salarie_id", salarieId!)
    .eq("actif", true)
    .maybeSingle();

  const aujourdHui = new Date().toISOString().slice(0, 10);

  if (contratActuel) {
    if (!champs.contratActif || contratActuel.type_contrat !== champs.typeContrat) {
      const { error } = await supabase
        .from("contrat")
        .update({ actif: false, date_fin: aujourdHui })
        .eq("id", contratActuel.id)
        .select()
        .single();
      if (error) {
        return { error: "Clôture du contrat impossible : " + error.message };
      }
    }
    if (champs.contratActif && contratActuel.type_contrat !== champs.typeContrat) {
      const { error } = await supabase.from("contrat").insert({
        salarie_id: salarieId!,
        type_contrat: champs.typeContrat,
        date_debut: aujourdHui,
        actif: true,
      });
      if (error) {
        return { error: "Création du nouveau contrat impossible : " + error.message };
      }
    }
  } else if (champs.contratActif) {
    const { error } = await supabase.from("contrat").insert({
      salarie_id: salarieId!,
      type_contrat: champs.typeContrat,
      date_debut: aujourdHui,
      actif: true,
    });
    if (error) {
      return { error: "Création du contrat impossible : " + error.message };
    }
  }

  revalidatePath("/admin/salaries");
  revalidatePath("/");
  return {};
}

export async function supprimerSalarie(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("salarie").delete().eq("id", id).select().single();

  if (error) {
    return { error: "Suppression impossible : " + error.message };
  }

  revalidatePath("/admin/salaries");
  revalidatePath("/");
  return {};
}
