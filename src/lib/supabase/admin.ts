import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Client service_role : contourne la RLS, réservé aux opérations qui en
// ont réellement besoin (créer/modifier un utilisateur Supabase Auth —
// cf. spec API, issue #26, « critère RPC vs. fonction Vercel »). `server-only`
// fait échouer le build si jamais importé depuis un composant client.
export function createAdminClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
