import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/compte/actions";
import UserMenu from "@/components/UserMenu";
import AdminNav from "@/components/admin/AdminNav";

// Branché sur le vrai backend le 25/09 (story #34) — jusqu'ici entièrement
// mock, sans la moindre vérification de session. La RLS protégeait déjà
// les données elles-mêmes, mais l'écran s'affichait à n'importe qui : même
// principe déjà corrigé sur /compte, appliqué ici.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: compte } = await supabase
    .from("compte")
    .select("nom, prenom, type_compte, poste, service:service_id(nom)")
    .eq("id", user.id)
    .single();

  if (!compte || compte.type_compte !== "administrateur") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-sm rounded border border-zinc-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-zinc-500">Connecté en tant que</p>
          <h1 className="mt-1 text-lg font-semibold text-zinc-800">{user.email}</h1>
          <p className="mt-3 text-xs text-zinc-500">
            Cette zone est réservée au rôle Administrateur d&apos;un EHPAD.
          </p>
          <form action={logout} className="mt-4">
            <button type="submit" className="text-sm font-medium text-zinc-700 hover:underline">
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2">
        <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
          Administration
        </span>
        <span className="text-xs text-amber-800">Accès réservé au rôle Administrateur</span>
        <Link href="/" className="ml-auto text-xs font-medium text-amber-900 hover:underline">
          ← Retour au planning
        </Link>
        <UserMenu
          utilisateur={{
            nom: compte.nom,
            prenom: compte.prenom,
            typeUtilisateur: "Administrateur",
            service: compte.service?.nom,
            poste: compte.poste ?? undefined,
          }}
        />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <AdminNav />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
