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
  // Assignation d'un roulement dès la création (retour client du 16/11) —
  // ignoré en modification, où l'assignation passe par assignerRoulement
  // (panneau "Gérer" dédié, avec historique).
  roulementId?: string;
};

// Type de paie directement sur salarie — remplace l'ancien concept de
// contrat (CDI/CDD) historisé dans une table séparée (retour client du
// 29/10 : la notion de contrat actif/inactif ne correspondait pas au
// besoin réel, cf. migration 20261029000001).
export async function enregistrerSalarie(
  id: string | undefined,
  champs: ChampsSalarie
): Promise<{ error?: string }> {
  if (!/^[A-Z0-9]{2,5}$/.test(champs.matricule)) {
    return { error: "Le matricule doit contenir entre 2 et 5 lettres et/ou chiffres." };
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
    const { data, error } = await supabase.from("salarie").insert(donneesSalarie).select("id").single();
    if (error) {
      return { error: "Création du salarié impossible : " + error.message };
    }
    if (champs.roulementId) {
      const { error: erreurRoulement } = await supabase.from("affectation_roulement").insert({
        salarie_id: data.id,
        roulement_id: champs.roulementId,
        date_debut: new Date().toISOString().slice(0, 10),
      });
      if (erreurRoulement) {
        // Annule la création plutôt que de laisser un salarié sans le
        // roulement demandé, sans qu'il n'y paraisse (même convention que
        // executer_import_salaries() côté script).
        await supabase.from("salarie").delete().eq("id", data.id);
        return { error: "Assignation du roulement impossible : " + erreurRoulement.message };
      }
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

export type ChampsAffectationRoulement = {
  roulementId: string;
};

// Assignation réelle d'un roulement à un salarié (story #35 dernier
// incrément) — remplace l'ancien état local React de SalariesAdminClient
// (perdu au rechargement). RLS réserve l'écriture sur affectation_roulement
// à l'administrateur, comme les autres tables de configuration.
//
// date_debut prend effet immédiatement (date du jour, calculée ici plutôt
// que saisie par l'admin — retour client du 16/11 : la seule chose que
// date_debut détermine est quel roulement est actuellement en vigueur pour
// le salarié, cf. appliquer_roulement ; la semaine réellement écrite sur le
// planning est un paramètre distinct, choisi par le manager en cliquant sur
// la bonne semaine dans l'écran Planning — l'admin n'a donc pas besoin de
// saisir de date ici). Pas de date_fin : un changement de roulement se fait
// simplement en assignant un nouveau roulement, qui devient le plus récent.
export async function assignerRoulement(
  salarieId: string,
  champs: ChampsAffectationRoulement
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("affectation_roulement")
    .insert({
      salarie_id: salarieId,
      roulement_id: champs.roulementId,
      date_debut: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (error) {
    return { error: "Assignation du roulement impossible : " + error.message };
  }

  revalidatePath("/admin/salaries");
  revalidatePath("/");
  return {};
}
