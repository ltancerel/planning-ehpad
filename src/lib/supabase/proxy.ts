import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes qui exigent une session : l'Émargement tourne encore sur des
// données mock, pas branchée sur le vrai backend (story #35, reste).
// Étendre cette liste au fur et à mesure du branchement des écrans. La
// vérification de rôle fine (administrateur_systeme pour /compte,
// administrateur pour /admin) reste faite dans chaque layout/page — ceci
// n'est qu'une redirection optimiste, cf. doc Next.js (pas d'accès base
// dans le proxy).
const PREFIXES_PROTEGES = ["/compte", "/admin"];

function routeProtegee(pathname: string): boolean {
  return pathname === "/" || PREFIXES_PROTEGES.some((prefixe) => pathname.startsWith(prefixe));
}

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

  if (routeProtegee(request.nextUrl.pathname) && !utilisateurConnecte) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Direction précise (/compte vs /admin vs /) laissée à la Server Action
  // de connexion, qui connaît le rôle réel — ici on ne fait que renvoyer
  // vers l'accueil, dont la page elle-même redirige au bon endroit pour un
  // administrateur_systeme (pas de compte "salarié", donc pas d'écran
  // Planning pour lui).
  if (request.nextUrl.pathname.startsWith("/login") && utilisateurConnecte) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
