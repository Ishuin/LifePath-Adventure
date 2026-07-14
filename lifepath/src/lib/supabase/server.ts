import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";

/**
 * RLS-scoped Supabase client for Server Components, Server Actions, and Route
 * Handlers. Reads/writes the session cookie; Postgres RLS enforces per-user
 * isolation using the user's JWT.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const env = publicEnv();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In Server Components cookies are read-only; the proxy refreshes the
          // session, so ignore write failures here.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* no-op */
          }
        },
      },
    },
  );
}
