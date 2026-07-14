"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

export type MagicLinkState = { error?: string; sent?: boolean };

export async function signInWithMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };

  const supabase = await createClient();
  const { NEXT_PUBLIC_SITE_URL } = publicEnv();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/confirm` },
  });
  if (error) return { error: error.message };
  return { sent: true };
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const { NEXT_PUBLIC_SITE_URL } = publicEnv();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/callback` },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  if (data.url) redirect(data.url);
}
