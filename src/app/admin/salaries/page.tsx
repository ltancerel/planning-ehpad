import { createClient } from "@/lib/supabase/server";
import { GROUPES_ROULEMENT, type GroupeRoulement, type TypePaie } from "@/lib/mock-data";
import { construireRoulements, grouperAffectationsParSalarie } from "@/lib/roulements";
import type { ValeurInitialeSalarie } from "@/components/admin/SalarieForm";
import SalariesAdminClient from "./SalariesAdminClient";

export default async function SalariesAdminPage() {
  const supabase = await createClient();

  const { data: servicesData } = await supabase
    .from("service")
    .select("id, nom, responsable:responsable_id(nom, prenom)")
    .order("nom");

  const services = (servicesData ?? []).map((s) => ({
    id: s.id,
    nom: s.nom,
    responsableNom: s.responsable ? `${s.responsable.prenom} ${s.responsable.nom}` : null,
  }));

  const { data: salariesData } = await supabase
    .from("salarie")
    .select(
      "id, matricule, nom, prenom, alignement_roulement, presence, type_paie, service:service_id(id, nom)"
    )
    .order("nom");

  const salaries: ValeurInitialeSalarie[] = (salariesData ?? []).map((s) => ({
    id: s.id,
    matricule: s.matricule,
    nom: s.nom,
    prenom: s.prenom,
    service: s.service?.nom ?? "",
    serviceId: s.service?.id ?? "",
    typePaie: s.type_paie as TypePaie,
    groupeRoulement: (s.alignement_roulement as GroupeRoulement | null) ?? GROUPES_ROULEMENT[0],
    presence: s.presence === "Absent" ? "Absent" : "Présent",
  }));

  // Roulements réels (motif + affectations), branchés le 12/11 (story #35
  // dernier incrément) — jusqu'ici ce panneau lisait ROULEMENTS_DEMO/
  // AFFECTATIONS_ROULEMENT_DEMO et n'écrivait qu'en état local React.
  const { data: roulementsData } = await supabase
    .from("roulement")
    .select(
      "id, nom, nb_semaines, roulement_jour(semaine_index, jour_semaine, code:code_horaire_id(code))"
    )
    .order("nom");
  const roulements = construireRoulements(roulementsData ?? []);

  const { data: affectationsData } = await supabase
    .from("affectation_roulement")
    .select("id, salarie_id, roulement_id, date_debut, date_fin");
  const affectationsRoulement = grouperAffectationsParSalarie(affectationsData ?? []);

  return (
    <SalariesAdminClient
      salaries={salaries}
      services={services}
      roulements={roulements}
      affectationsRoulement={affectationsRoulement}
    />
  );
}
