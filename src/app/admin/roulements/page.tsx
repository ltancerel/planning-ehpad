import { createClient } from "@/lib/supabase/server";
import type { Roulement } from "@/lib/mock-data";
import type { HoraireCode } from "@/lib/horaire-codes";
import RoulementsAdminClient from "./RoulementsAdminClient";

export default async function RoulementsAdminPage() {
  const supabase = await createClient();

  const { data: codes } = await supabase
    .from("code_horaire")
    .select("code, intitule, categorie, couleur_fond, couleur_texte")
    .eq("categorie", "travail")
    .order("code");

  const codesHoraires: HoraireCode[] = (codes ?? []).map((c) => ({
    code: c.code,
    intitule: c.intitule,
    categorie: "travail",
    couleurFond: c.couleur_fond,
    couleurTexte: c.couleur_texte,
  }));

  const { data } = await supabase
    .from("roulement")
    .select("id, nom, nb_semaines, roulement_jour(semaine_index, jour_semaine, code_horaire:code_horaire_id(code))")
    .order("nom");

  const roulements: Roulement[] = (data ?? []).map((r) => {
    const motif: string[][] = Array.from({ length: r.nb_semaines }, () => new Array(7).fill(""));
    for (const jour of r.roulement_jour) {
      if (jour.semaine_index < r.nb_semaines) {
        motif[jour.semaine_index][jour.jour_semaine] = jour.code_horaire?.code ?? "";
      }
    }
    return { id: r.id, nom: r.nom, nbSemaines: r.nb_semaines, motif };
  });

  return <RoulementsAdminClient roulements={roulements} codesHoraires={codesHoraires} />;
}
