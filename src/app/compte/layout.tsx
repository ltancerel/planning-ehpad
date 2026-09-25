import Image from "next/image";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";
import logoAiotConseil from "../../../public/logo-aiot-conseil.png";

// Couleurs extraites du logo AioT-Conseil : #24543c (vert sapin foncé,
// dominant) et #9cd878 (vert clair, accent) — palette de toute la zone
// Administrateur Système (/compte/*), demandée le 25/09. N'affecte que
// cette zone, pas le reste de l'application (encore en mock/palette ambre).
export default async function CompteLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Toute la zone /compte/* est pensée pour l'Administrateur Système
  // uniquement (cf. story #34) — la RLS empêchait déjà tout compte
  // administrateur d'EHPAD d'agir réellement dessus (créer/supprimer un
  // EHPAD), mais rien n'empêchait l'écran de s'afficher quand même, avec
  // un badge « Administrateur Système » trompeur. Corrigé le 25/09, repéré
  // après un test réel : un compte administrateur d'EHPAD connecté voit
  // désormais un écran honnête plutôt que les commandes système.
  const { data: estAdministrateurSysteme } = await supabase.rpc("est_administrateur_systeme");

  return (
    <div className="flex h-full flex-col bg-[#eef7ea]">
      <header className="flex shrink-0 items-center gap-3 bg-[#24543c] px-4 py-2 text-white shadow-sm">
        <Image src={logoAiotConseil} alt="AioT-Conseil" className="h-9 w-auto" priority />
        <span className="rounded bg-[#9cd878] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#183c28]">
          Administration Système
        </span>
      </header>
      <div className="flex-1 overflow-auto">
        {estAdministrateurSysteme ? (
          children
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="w-full max-w-sm rounded border border-[#c7e3ba] bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-[#3c6c48]">Connecté en tant que</p>
              <h1 className="mt-1 text-lg font-semibold text-[#183c28]">{user.email}</h1>
              <p className="mt-3 text-xs text-gray-500">
                Cette zone est réservée à l&apos;Administrateur Système. L&apos;espace dédié à
                l&apos;Administrateur d&apos;établissement n&apos;est pas encore construit (stories #34/#35,
                en cours).
              </p>
              <form action={logout} className="mt-4">
                <button type="submit" className="text-sm font-medium text-[#24543c] hover:underline">
                  Se déconnecter
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
