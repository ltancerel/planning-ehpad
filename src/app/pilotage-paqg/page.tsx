import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppTabs from "@/components/AppTabs";
import UserMenu from "@/components/UserMenu";

// EPIC Multi-application (#46), story #47 (maquette) — périmètre
// fonctionnel de Pilotage PAQG encore TBD, à définir avec le client.
// Placeholder pour que l'onglet soit cliquable et cohérent avec les deux
// autres applications pendant la maquette.
export default async function PilotagePaqg() {
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

  if (!compte) {
    redirect("/compte");
  }

  const { data: ehpad } = await supabase.from("ehpad").select("nom, logo_base64").single();
  const logo = ehpad?.logo_base64 ?? null;

  return (
    <div className="flex h-screen flex-col bg-white text-sm text-zinc-900">
      <header className="flex shrink-0 flex-col border-b border-zinc-200">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo dynamique (data URL uploadé), incompatible avec next/image
              <img src={logo} alt="" className="h-7 w-7 rounded object-contain" />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded bg-zinc-200 text-xs font-semibold text-zinc-500">
                {ehpad?.nom.charAt(0) ?? "?"}
              </span>
            )}
            <div className="leading-tight">
              <h1 className="font-semibold text-zinc-800">{ehpad?.nom}</h1>
              <p className="text-[10px] text-zinc-400">Pilotage PAQG</p>
            </div>
          </div>
          <UserMenu
            utilisateur={{
              nom: compte.nom,
              prenom: compte.prenom,
              typeUtilisateur: compte.type_compte,
              poste: compte.poste ?? undefined,
            }}
          />
        </div>
        <AppTabs actif="pilotage-paqg" />
      </header>

      <div className="flex flex-1 items-center justify-center">
        <p className="max-w-md text-center text-sm text-zinc-500">
          Pilotage PAQG — maquette à venir. Périmètre fonctionnel à définir avec le client (cf. issue #47).
        </p>
      </div>
    </div>
  );
}
