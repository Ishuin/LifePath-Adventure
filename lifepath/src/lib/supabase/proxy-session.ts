import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";

/** Route prefixes that require an authenticated user. */
const PROTECTED = ["/dashboard", "/onboarding", "/goals"];

function isProtected(pathname: string) {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Refreshes the Supabase session cookie on every request and redirects
 * unauthenticated users away from protected routes. Runs in the Node.js
 * `proxy` runtime (Next 16). If env is unconfigured, it becomes a no-op so the
 * public site still renders.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  let env: ReturnType<typeof publicEnv>;
  try {
    env = publicEnv();
  } catch {
    return response; // unconfigured: don't crash public routes
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
