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
  typePaie: "25/M" | "30/M" | "Aucun";
  alignementRoulement: string;
  presence: "Présent" | "Absent";
};

// Type de paie directement sur salarie — remplace l'ancien concept de
// contrat (CDI/CDD) historisé dans une table séparée (retour client du
// 29/10 : la notion de contrat actif/inactif ne correspondait pas au
// besoin réel, cf. migration 20261029000001).
export async function enregistrerSalarie(
  id: string | undefined,
  champs: ChampsSalarie
): Promise<{ error?: string }> {
  if (!/^[A-Z]{2,5}$/.test(champs.matricule)) {
    return { error: "Le matricule doit contenir entre 2 et 5 lettres majuscules." };
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
    type_paie: champs.typePaie,
    alignement_roulement: champs.alignementRoulement || null,
    presence: champs.presence,
  };

  // .select().single() partout : détecte un 0-ligne-affectée (RLS qui
  // filtre silencieusement) au lieu de rapporter un faux succès — même
  // piège que le bug identité EHPAD du 25/09 (migration 20260925000007).
  if (id) {
    const { error } = await supabase.from("salarie").update(donneesSalarie).eq("id", id).select().single();
    if (error) {
      return { error: "Mise à jour du salarié impossible : " + error.message };
    }
  } else {
    const { error } = await supabase.from("salarie").insert(donneesSalarie).select("id").single();
    if (error) {
      return { error: "Création du salarié impossible : " + error.message };
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
