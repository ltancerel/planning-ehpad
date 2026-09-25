import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

export default async function ComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: admin } = await supabase
    .from("administrateur_systeme")
    .select("nom, prenom, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-sm rounded border border-[#c7e3ba] bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-[#3c6c48]">Connecté en tant que</p>
        <h1 className="mt-1 text-lg font-semibold text-[#183c28]">
          {admin ? `${admin.prenom} ${admin.nom}` : user.email}
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          Administrateur Système{admin?.email ? ` · ${admin.email}` : ""}
        </p>
        <Link
          href="/compte/ehpads"
          className="mt-4 block rounded border border-[#c7e3ba] bg-[#eef7ea] px-3 py-2 text-sm font-medium text-[#183c28] hover:bg-[#dcefd3]"
        >
          Gérer les EHPAD →
        </Link>
        <form action={logout} className="mt-4">
          <button type="submit" className="text-sm font-medium text-[#24543c] hover:underline">
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
