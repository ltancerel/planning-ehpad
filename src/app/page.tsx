import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlanningGrid from "@/components/PlanningGrid";
import { GROUPES_ROULEMENT, type GroupeRoulement, type ProfilUtilisateur, type TypePaie } from "@/lib/mock-data";
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

  const { data: servicesData } = await supabase
    .from("service")
    .select("nom, responsable_id, responsable:responsable_id(nom, prenom)")
    .order("nom");
  const services = servicesData ?? [];
  const mesServices = services.filter((s) => s.responsable_id === user.id).map((s) => s.nom);

  // Un manager/administrateur peut être responsable de plusieurs services
  // (service.responsable_id) : regroupés ici pour le filtre "Manager" du
  // planning, qui sélectionne en un clic tous les services d'un manager
  // donné — retour client du 12/11 (rétablit l'ancien filtre manager,
  // mais dérivé du service plutôt qu'un champ salarié.manager déconnecté).
  const managersParId = new Map<string, { id: string; nom: string; services: string[] }>();
  for (const s of services) {
    if (!s.responsable_id || !s.responsable) continue;
    const existant = managersParId.get(s.responsable_id);
    if (existant) existant.services.push(s.nom);
    else
      managersParId.set(s.responsable_id, {
        id: s.responsable_id,
        nom: `${s.responsable.prenom} ${s.responsable.nom}`,
        services: [s.nom],
      });
  }
  const managers = [...managersParId.values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  const { data: joursFeriesData } = await supabase.from("jour_ferie").select("date").eq("actif", true);
  const joursFeries = (joursFeriesData ?? []).map((j) => j.date);

  const { data: salariesData } = await supabase
    .from("salarie")
    .select("id, nom, prenom, alignement_roulement, presence, type_paie, service:service_id(nom)")
    .order("nom");

  const salaries = (salariesData ?? []).map((s) => ({
    id: s.id,
    nom: s.nom,
    prenom: s.prenom,
    service: s.service?.nom ?? "",
    groupeRoulement: (s.alignement_roulement as GroupeRoulement | null) ?? GROUPES_ROULEMENT[0],
    presence: s.presence === "Absent" ? ("Absent" as const) : ("Présent" as const),
    typePaie: s.type_paie as TypePaie,
  }));

  const { data: codesData } = await supabase
    .from("code_horaire")
    .select(
      "code, intitule, categorie, couleur_fond, couleur_texte, commentaire, afficher_vue_annuelle, type_evenement, duree_heures, plage_horaire(heure_debut, heure_fin, ordre)"
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
      servicesOrdre={services.map((s) => s.nom)}
      managers={managers}
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
