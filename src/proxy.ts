import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Maquette multi-application (EPIC #46) : / , /pilotage-paqg et
    // /actions-paqg sont des pages statiques sans backend sur cette branche
    // exploratoire (aucune dépendance Supabase voulue, cf. story #47) —
    // exclues ici pour ne pas déclencher la vérification de session, qui
    // échouerait sans variables d'environnement Supabase configurées.
    "/((?!_next/static|_next/image|favicon.ico|pilotage-paqg|actions-paqg|$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
