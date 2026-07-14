import Link from "next/link";
import ConstellationBg from "@/components/ConstellationBg";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <ConstellationBg />

      <header className="glass sticky top-0 z-10 flex items-center justify-between px-6 py-4 md:px-10">
        <span className="text-lg font-bold text-[var(--color-accent)]">
          LifePath
        </span>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#how" className="text-[var(--color-muted)] hover:text-white">
            How it works
          </a>
          <Link
            href="/login"
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 font-medium text-white shadow-[0_0_10px_rgba(76,175,80,0.5)] transition hover:bg-[var(--color-accent-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main className="relative z-[1] flex flex-1 flex-col">
        <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
          <h1 className="text-glow text-5xl font-bold leading-tight md:text-6xl">
            Turn your life into a game.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[var(--color-muted)]">
            Tell LifePath where you are now, where you&apos;ve been, and the goal
            you&apos;re chasing. It builds your quest: a step-by-step path with
            skills, levels, certifications, courses, a budget, and the
            connections to make along the way.
          </p>
          <Link
            href="/login"
            className="mt-10 rounded-md bg-[var(--color-accent)] px-8 py-4 text-lg font-medium text-white shadow-[0_0_10px_rgba(76,175,80,0.5)] transition hover:scale-105 hover:bg-[var(--color-accent-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            Start your path
          </Link>
        </section>

        <section
          id="how"
          className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-3"
        >
          {[
            {
              t: "1 · Describe",
              d: "Your current state, your past, and the goal you want to reach.",
            },
            {
              t: "2 · Generate",
              d: "A personalized path: steps, skills, levels, certs, courses, budget, connections.",
            },
            {
              t: "3 · Level up",
              d: "Complete steps, gain XP, and watch your character progress toward the goal.",
            },
          ].map((c) => (
            <div key={c.t} className="glass rounded-xl p-6">
              <h2 className="text-lg font-semibold text-[var(--color-accent)]">
                {c.t}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{c.d}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="glass px-6 py-6 text-center text-sm text-[var(--color-muted)]">
        © {2026} LifePath. All rights reserved.
      </footer>
    </div>
  );
}
