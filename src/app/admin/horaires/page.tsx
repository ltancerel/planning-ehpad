import { createClient } from "@/lib/supabase/server";
import type { HoraireCategorie, TypeEvenement } from "@/lib/horaire-codes";
import HorairesAdminClient, { type HoraireCodeReel } from "./HorairesAdminClient";

export default async function HorairesAdminPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("code_horaire")
    .select(
      "id, code, intitule, categorie, couleur_fond, couleur_texte, commentaire, afficher_vue_annuelle, action, type_evenement, duree_heures, plage_horaire(heure_debut, heure_fin, ordre)"
    )
    .order("code");

  const codes: HoraireCodeReel[] = (data ?? []).map((c) => ({
    id: c.id,
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

  return <HorairesAdminClient codes={codes} />;
}
