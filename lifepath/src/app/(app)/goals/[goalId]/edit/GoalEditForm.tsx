"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateGoalAction } from "@/app/(app)/actions";

const inputClass =
  "w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 outline-none focus-visible:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";

/** Edits a goal's title, description, and target date. */
export function GoalEditForm({
  goalId,
  initial,
}: {
  goalId: string;
  initial: { title: string; description: string; targetDate: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [targetDate, setTargetDate] = useState(initial.targetDate);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateGoalAction(goalId, {
        title,
        description,
        targetDate,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push(`/goals/${goalId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="glass max-w-xl space-y-5 rounded-xl p-6">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="targetDate" className="mb-1 block text-sm font-medium">
          Target date
        </label>
        <input
          id="targetDate"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 font-medium text-white transition hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <Link
          href={`/goals/${goalId}`}
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
