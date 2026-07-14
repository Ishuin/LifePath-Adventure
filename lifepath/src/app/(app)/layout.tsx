import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOut } from "./actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass flex items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="font-bold text-[var(--color-accent)]">
          LifePath
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[var(--color-muted)]">{user.email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-white/15 px-3 py-1.5 transition hover:bg-white/5"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
