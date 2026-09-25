import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreerEhpadFormulaire from "./CreerEhpadFormulaire";
import SupprimerEhpadBouton from "./SupprimerEhpadBouton";

export default async function GestionEhpadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS ("lecture ehpad") ne renvoie tous les EHPAD que pour
  // administrateur_systeme ; un autre type de compte ne verrait que le
  // sien, voire aucun s'il n'a pas d'ehpad_id résolu — la page reste sûre
  // même sans vérification explicite du rôle ici.
  const { data: ehpads, error } = await supabase
    .from("ehpad")
    .select("id, nom, actif")
    .order("nom");

  return (
    <div className="h-full overflow-auto bg-amber-50 p-4">
      <Link href="/compte" className="text-xs font-medium text-amber-900 hover:underline">
        ← Retour
      </Link>
      <h1 className="mb-1 mt-2 text-lg font-semibold text-amber-900">Gestion des EHPAD</h1>
      <p className="mb-4 text-xs text-amber-800">
        Réservé à l&apos;Administrateur Système — tous établissements confondus.
      </p>

      <div className="max-w-lg rounded border border-amber-200 bg-white p-4">
        <CreerEhpadFormulaire />

        <ul className="mt-4 divide-y divide-zinc-100 border-t border-zinc-100">
          {ehpads?.map((ehpad) => (
            <li key={ehpad.id} className="py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-800">
                  {ehpad.nom}
                  {!ehpad.actif && (
                    <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                      inactif
                    </span>
                  )}
                </span>
                <SupprimerEhpadBouton id={ehpad.id} nom={ehpad.nom} />
              </div>
            </li>
          ))}
          {ehpads?.length === 0 && (
            <li className="py-2 text-sm text-zinc-500">Aucun EHPAD pour l&apos;instant.</li>
          )}
        </ul>

        {error && <p className="mt-3 text-xs text-red-600">Erreur de lecture : {error.message}</p>}
      </div>
    </div>
  );
}
