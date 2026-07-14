import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div>
      <h1 className="text-3xl font-bold">Your goals</h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Signed in as {user.email}.
      </p>

      {/* M1 will replace this with real goal cards + the intake wizard. */}
      <div className="glass mt-8 rounded-xl p-10 text-center">
        <p className="text-lg">No goals yet.</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Creating goals and generating your LifePath arrives in the next
          milestone.
        </p>
        <button
          disabled
          className="mt-6 cursor-not-allowed rounded-md bg-[var(--color-accent)] px-6 py-3 font-medium text-white opacity-50"
        >
          New goal (coming soon)
        </button>
      </div>
    </div>
  );
}
