import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";

// Next.js 16 renamed `middleware` to `proxy` (Node.js runtime).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on all routes except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
