import { createClient } from "@/lib/supabase/server";
import type { AnneePlanifiee, JourFerie } from "@/lib/mock-data";
import AnneesAdminClient from "./AnneesAdminClient";

export default async function AnneesAdminPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("annee_planifiee")
    .select("id, annee, jour_demarrage, jour_ferie(date, label, type, actif)")
    .order("annee");

  const annees: AnneePlanifiee[] = (data ?? []).map((a) => ({
    id: a.id,
    annee: a.annee,
    jourDemarrage: a.jour_demarrage,
    joursFeries: [...a.jour_ferie]
      .sort((x, y) => x.date.localeCompare(y.date))
      .map((j): JourFerie => ({
        date: j.date,
        label: j.label,
        type: j.type as JourFerie["type"],
        actif: j.actif,
      })),
  }));

  return <AnneesAdminClient annees={annees} />;
}
