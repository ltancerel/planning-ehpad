import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Seules les routes sous /compte exigent une session : le reste de
// l'application (Planning, Émargement, Administration…) tourne encore sur
// des données mock, pas branchée sur le vrai backend (stories #34/#35).
// Étendre cette liste au fur et à mesure du branchement des écrans.
const ROUTES_PROTEGEES = ["/compte"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Ne rien exécuter entre createServerClient et getClaims() : source
  // classique de déconnexions aléatoires si on l'oublie (cf. doc Supabase).
  const { data } = await supabase.auth.getClaims();
  const utilisateurConnecte = Boolean(data?.claims);

  const routeProtegee = ROUTES_PROTEGEES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (routeProtegee && !utilisateurConnecte) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname.startsWith("/login") && utilisateurConnecte) {
    const url = request.nextUrl.clone();
    url.pathname = "/compte";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
