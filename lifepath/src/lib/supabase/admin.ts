import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

/**
 * Service-role Supabase client that BYPASSES RLS. Server-only. Use exclusively
 * in trusted server paths that must act across users. Never import client-side.
 */
export function createAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = publicEnv();
  const { SUPABASE_SERVICE_ROLE_KEY } = serverEnv();
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for the admin client.");
  }
  return createSupabaseClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
