import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlanningGrid from "@/components/PlanningGrid";
import { GROUPES_ROULEMENT, type GroupeRoulement, type Manager, type ProfilUtilisateur, type TypePaie } from "@/lib/mock-data";
import type { HoraireCategorie, HoraireCode, TypeEvenement } from "@/lib/horaire-codes";

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
    .select("nom, prenom, type_compte, poste")
    .eq("id", user.id)
    .single();

  // Un compte administrateur_systeme n'a pas d'EHPAD propre : pas d'écran
  // Planning pour lui (défense en profondeur si /  est tapée directement,
  // le lien normal passe par /compte).
  if (!compte) {
    redirect("/compte");
  }

  const { data: ehpad } = await supabase.from("ehpad").select("nom, logo_base64").single();

  const { data: services } = await supabase.from("service").select("nom, responsable_id").order("ordre");
  const mesServices = (services ?? []).filter((s) => s.responsable_id === user.id).map((s) => s.nom);

  const { data: joursFeriesData } = await supabase.from("jour_ferie").select("date").eq("actif", true);
  const joursFeries = (joursFeriesData ?? []).map((j) => j.date);

  const { data: salariesData } = await supabase
    .from("salarie")
    .select("id, nom, prenom, manager, alignement_roulement, presence, type_paie, service:service_id(nom)")
    .order("nom");

  const salaries = (salariesData ?? []).map((s) => ({
    id: s.id,
    nom: s.nom,
    prenom: s.prenom,
    service: s.service?.nom ?? "",
    manager: (s.manager as Manager | null) ?? "Aucun",
    groupeRoulement: (s.alignement_roulement as GroupeRoulement | null) ?? GROUPES_ROULEMENT[0],
    presence: s.presence === "Absent" ? ("Absent" as const) : ("Présent" as const),
    typePaie: s.type_paie as TypePaie,
  }));

  const { data: codesData } = await supabase
    .from("code_horaire")
    .select(
      "code, intitule, categorie, couleur_fond, couleur_texte, commentaire, afficher_vue_annuelle, action, type_evenement, duree_heures, plage_horaire(heure_debut, heure_fin, ordre)"
    )
    .order("code");

  const codesHoraires: HoraireCode[] = (codesData ?? []).map((c) => ({
    code: c.code,
    intitule: c.intitule,
    categorie: c.categorie as HoraireCategorie,
    couleurFond: c.couleur_fond,
    couleurTexte: c.couleur_texte,
    commentaire: c.commentaire ?? undefined,
    afficherVueAnnuelle: c.afficher_vue_annuelle,
    action: c.action ?? undefined,
    typeEvenement: (c.type_evenement as TypeEvenement | null) ?? undefined,
    duree: c.duree_heures ?? undefined,
    plages:
      c.categorie === "travail"
        ? [...c.plage_horaire]
            .sort((a, b) => a.ordre - b.ordre)
            .map((p) => ({ debut: p.heure_debut.slice(0, 5), fin: p.heure_fin.slice(0, 5) }))
        : undefined,
  }));

  return (
    <PlanningGrid
      salaries={salaries}
      servicesOrdre={(services ?? []).map((s) => s.nom)}
      codesHoraires={codesHoraires}
      joursFeries={joursFeries}
      ehpad={{ nom: ehpad?.nom ?? "", logo: ehpad?.logo_base64 ?? null }}
      utilisateur={{
        nom: compte.nom,
        prenom: compte.prenom,
        typeUtilisateur: LABEL_TYPE_COMPTE[compte.type_compte] ?? "Utilisateur",
        service: mesServices.join(", "),
        mesServices,
        poste: compte.poste ?? "",
      }}
    />
  );
}
