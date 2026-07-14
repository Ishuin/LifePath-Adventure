"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  signInWithMagicLink,
  signInWithGoogle,
  type MagicLinkState,
} from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<MagicLinkState, FormData>(
    signInWithMagicLink,
    {},
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass w-full max-w-sm rounded-2xl p-8">
        <Link
          href="/"
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          ← LifePath
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Start or continue your path.
        </p>

        {state.sent ? (
          <p className="mt-6 rounded-md border border-[var(--color-accent)] bg-[rgba(76,175,80,0.1)] p-4 text-sm">
            Check your inbox — we sent you a magic sign-in link.
          </p>
        ) : (
          <form action={formAction} className="mt-6 flex flex-col gap-3">
            <label htmlFor="email" className="text-sm text-[var(--color-muted)]">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="rounded-md border border-white/15 bg-black/30 px-3 py-2 outline-none focus-visible:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            />
            {state.error && (
              <p className="text-sm text-red-400">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-md bg-[var(--color-accent)] px-4 py-2 font-medium text-white transition hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}

        <div className="my-6 flex items-center gap-3 text-xs text-[var(--color-muted)]">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full rounded-md border border-white/15 bg-black/20 px-4 py-2 font-medium transition hover:bg-black/40"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}
