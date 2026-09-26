import { createClient } from "@/lib/supabase/server";
import IdentiteEhpadFormulaire from "./IdentiteEhpadFormulaire";

export default async function IdentiteEhpadPage() {
  const supabase = await createClient();
  // Pas de filtre explicite : la RLS ("lecture ehpad") ne renvoie de toute
  // façon que le propre établissement de l'administrateur connecté.
  const { data: ehpad } = await supabase.from("ehpad").select("nom, logo_base64").single();

  return (
    <div className="h-full overflow-auto p-4">
      <h1 className="mb-1 text-lg font-semibold text-zinc-800">Identité de l&apos;établissement</h1>
      <p className="mb-4 text-xs text-zinc-500">
        Titre et logo affichés en haut à gauche de l&apos;application.
      </p>

      <IdentiteEhpadFormulaire nomInitial={ehpad?.nom ?? ""} logoInitial={ehpad?.logo_base64 ?? null} />
    </div>
  );
}
