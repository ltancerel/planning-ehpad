import { createClient } from "@/lib/supabase/server";
import type { Utilisateur } from "@/lib/mock-data";
import UtilisateursAdminClient from "./UtilisateursAdminClient";

const TYPE_COMPTE_DEPUIS_DB: Record<string, Utilisateur["typeUtilisateur"]> = {
  administrateur: "Administrateur",
  manager: "Manager",
  utilisateur: "Utilisateur",
};

export default async function UtilisateursAdminPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("compte")
    .select("id, identifiant, nom, prenom, email, type_compte, poste, service:service_id(nom)")
    .order("nom");

  const utilisateurs: Utilisateur[] = (data ?? []).map((c) => ({
    id: c.id,
    identifiant: c.identifiant,
    nom: c.nom,
    prenom: c.prenom,
    email: c.email,
    typeUtilisateur: TYPE_COMPTE_DEPUIS_DB[c.type_compte] ?? "Utilisateur",
    service: c.service?.nom ?? "",
    poste: c.poste ?? "",
  }));

  const { data: services } = await supabase.from("service").select("id, nom").order("ordre");

  return <UtilisateursAdminClient utilisateurs={utilisateurs} services={services ?? []} />;
}
