import { createClient } from "@/lib/supabase/server";
import { GROUPES_ROULEMENT, type Manager, type GroupeRoulement, type TypePaie } from "@/lib/mock-data";
import type { ValeurInitialeSalarie } from "@/components/admin/SalarieForm";
import SalariesAdminClient from "./SalariesAdminClient";

export default async function SalariesAdminPage() {
  const supabase = await createClient();

  const { data: services } = await supabase.from("service").select("id, nom").order("ordre");

  const { data: salariesData } = await supabase
    .from("salarie")
    .select(
      "id, matricule, nom, prenom, manager, alignement_roulement, presence, type_paie, service:service_id(id, nom)"
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
    manager: (s.manager as Manager | null) ?? "Aucun",
    groupeRoulement: (s.alignement_roulement as GroupeRoulement | null) ?? GROUPES_ROULEMENT[0],
    presence: s.presence === "Absent" ? "Absent" : "Présent",
  }));

  return <SalariesAdminClient salaries={salaries} services={services ?? []} />;
}
