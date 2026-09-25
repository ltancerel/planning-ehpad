import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlanningGrid from "@/components/PlanningGrid";
import type { ProfilUtilisateur } from "@/lib/mock-data";

const LABEL_TYPE_COMPTE: Record<string, ProfilUtilisateur["typeUtilisateur"]> = {
  administrateur: "Administrateur",
  manager: "Manager",
  utilisateur: "Utilisateur",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: compte } = await supabase
    .from("compte")
    .select("nom, prenom, type_compte, poste, service:service_id(nom)")
    .eq("id", user.id)
    .single();

  // Un compte administrateur_systeme n'a pas d'EHPAD propre : pas d'écran
  // Planning pour lui (défense en profondeur si /  est tapée directement,
  // le lien normal passe par /compte).
  if (!compte) {
    redirect("/compte");
  }

  const { data: ehpad } = await supabase.from("ehpad").select("nom, logo_base64").single();

  const { data: services } = await supabase.from("service").select("nom").order("ordre");

  const { data: salariesData } = await supabase
    .from("salarie")
    .select("id, nom, prenom, service:service_id(nom)")
    .order("nom");

  const salaries = (salariesData ?? []).map((s) => ({
    id: s.id,
    nom: s.nom,
    prenom: s.prenom,
    service: s.service?.nom ?? "",
  }));

  return (
    <PlanningGrid
      salaries={salaries}
      servicesOrdre={(services ?? []).map((s) => s.nom)}
      ehpad={{ nom: ehpad?.nom ?? "", logo: ehpad?.logo_base64 ?? null }}
      utilisateur={{
        nom: compte.nom,
        prenom: compte.prenom,
        typeUtilisateur: LABEL_TYPE_COMPTE[compte.type_compte] ?? "Utilisateur",
        service: compte.service?.nom ?? "",
        poste: compte.poste ?? "",
      }}
    />
  );
}
