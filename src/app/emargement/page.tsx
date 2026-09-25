import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Salarie } from "@/lib/mock-data";
import type { HoraireCategorie, HoraireCode, TypeEvenement, ValeurCellule } from "@/lib/horaire-codes";
import { formatDateISO, genererPeriode, lundiDeLaSemaine, lundiLePlusProche, parseDateISO } from "@/lib/dates";
import { chargerPlanningReel } from "@/app/planning-actions";
import EmargementContenu from "@/components/EmargementContenu";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function resoudreSalarieCible(supabase: SupabaseClient, salarieIdParam?: string) {
  if (salarieIdParam) {
    const { data } = await supabase
      .from("salarie")
      .select("id, nom, prenom, service:service_id(nom)")
      .eq("id", salarieIdParam)
      .maybeSingle();
    if (data) return data;
  }
  const { data } = await supabase
    .from("salarie")
    .select("id, nom, prenom, service:service_id(nom)")
    .order("nom")
    .limit(1)
    .maybeSingle();
  return data;
}

// Même calcul que EmargementMensuel (fenêtre de 4/6 semaines, départ au
// lundi le plus proche du milieu du mois passé en paramètre) — dupliqué ici
// pour pouvoir précharger côté serveur les seules données réellement
// affichées, la navigation de cet écran passant par de vrais changements
// d'URL (contrairement à la grille Planning, dont la fenêtre glisse
// entièrement côté client, cf. commentaire dans PlanningGrid).
function calculerFenetreMensuelle(moisParam?: string, debutParam?: string, semainesParam?: string) {
  const nbSemaines = semainesParam === "6" ? 6 : 4;
  const debutFenetre = debutParam
    ? lundiDeLaSemaine(parseDateISO(debutParam))
    : lundiLePlusProche(
        moisParam
          ? new Date(parseDateISO(`${moisParam}-01`).getFullYear(), parseDateISO(`${moisParam}-01`).getMonth(), 15)
          : new Date(2026, 8, 15)
      );
  const jours = genererPeriode(debutFenetre, nbSemaines * 7);
  return { debut: formatDateISO(jours[0]), fin: formatDateISO(jours[jours.length - 1]) };
}

export default async function EmargementPage({
  searchParams,
}: {
  searchParams: Promise<{ salarie?: string; vue?: string; mois?: string; debut?: string; semaines?: string; annee?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const salarieRow = await resoudreSalarieCible(supabase, params.salarie);

  if (!salarieRow) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-sm text-zinc-500">
        Aucun salarié. Créez d&apos;abord un salarié depuis l&apos;administration.
      </div>
    );
  }

  const salarie: Salarie = {
    id: salarieRow.id,
    nom: salarieRow.nom,
    prenom: salarieRow.prenom,
    service: salarieRow.service?.nom ?? "",
  };

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

  const vue = params.vue === "annuel" ? "annuel" : "mensuel";
  const annee = params.annee ? Number(params.annee) : 2026;
  const { debut, fin } =
    vue === "annuel"
      ? { debut: `${annee}-01-01`, fin: `${annee}-12-31` }
      : calculerFenetreMensuelle(params.mois, params.debut, params.semaines);

  const { planning: planningData, error: erreurPlanning } = await chargerPlanningReel(debut, fin, salarie.id);
  const planning: Record<string, ValeurCellule> = planningData ?? {};

  const { data: joursFeriesData } = await supabase.from("jour_ferie").select("date").eq("actif", true);
  const joursFeries = (joursFeriesData ?? []).map((j) => j.date);

  const { data: validationsData } = await supabase
    .from("validation_emargement")
    .select("annee, mois")
    .eq("salarie_id", salarie.id);
  const validations = (validationsData ?? []).map((v) => `${v.annee}-${v.mois}`);

  return (
    <Suspense fallback={null}>
      <EmargementContenu
        salarie={salarie}
        codesHoraires={codesHoraires}
        planning={planning}
        erreurPlanning={erreurPlanning}
        joursFeries={joursFeries}
        validations={validations}
      />
    </Suspense>
  );
}
