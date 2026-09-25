import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Salarie } from "@/lib/mock-data";
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

export default async function EmargementPage({
  searchParams,
}: {
  searchParams: Promise<{ salarie?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { salarie: salarieIdParam } = await searchParams;
  const salarieRow = await resoudreSalarieCible(supabase, salarieIdParam);

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

  const { data: joursFeriesData } = await supabase.from("jour_ferie").select("date").eq("actif", true);
  const joursFeries = (joursFeriesData ?? []).map((j) => j.date);

  const { data: validationsData } = await supabase
    .from("validation_emargement")
    .select("annee, mois")
    .eq("salarie_id", salarie.id);
  const validations = (validationsData ?? []).map((v) => `${v.annee}-${v.mois}`);

  return (
    <Suspense fallback={null}>
      <EmargementContenu salarie={salarie} joursFeries={joursFeries} validations={validations} />
    </Suspense>
  );
}
