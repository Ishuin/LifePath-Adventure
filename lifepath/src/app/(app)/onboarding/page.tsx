"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGoal } from "./actions";
import { intakeSchema } from "@/lib/validation/intake";

type PastState = { summary: string; asOf: string };

const inputClass =
  "w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 outline-none focus-visible:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";

export default function OnboardingPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [currentSummary, setCurrentSummary] = useState("");
  const [pastStates, setPastStates] = useState<PastState[]>([
    { summary: "", asOf: "" },
  ]);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [budget, setBudget] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");

  const steps = ["Where you are", "Where you've been", "Your goal"];

  function submit() {
    setError(null);
    const payload = {
      goalTitle,
      goalDescription: goalDescription || undefined,
      targetDate: targetDate || undefined,
      currentSummary,
      pastStates: pastStates
        .filter((p) => p.summary.trim())
        .map((p) => ({ summary: p.summary, asOf: p.asOf || undefined })),
      budgetCents: budget ? Math.round(Number(budget) * 100) : undefined,
      hoursPerWeek: hoursPerWeek ? Number(hoursPerWeek) : undefined,
    };
    const parsed = intakeSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your answers.");
      return;
    }
    startTransition(async () => {
      const res = await createGoal(parsed.data);
      if (res.error) setError(res.error);
      else router.push("/dashboard");
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Start a new path</h1>
      <ol className="mt-4 flex gap-2 text-sm">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`rounded-full px-3 py-1 ${
              i === step
                ? "bg-[var(--color-accent)] text-white"
                : "glass text-[var(--color-muted)]"
            }`}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <div className="glass mt-6 rounded-xl p-6">
        {step === 0 && (
          <div className="flex flex-col gap-3">
            <label className="text-sm text-[var(--color-muted)]">
              Describe where you are right now — role, skills, situation.
            </label>
            <textarea
              className={inputClass}
              rows={5}
              value={currentSummary}
              onChange={(e) => setCurrentSummary(e.target.value)}
              placeholder="e.g. Junior frontend dev, 1 yr experience, comfortable with React, no backend or system-design skills yet…"
            />
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--color-muted)]">
              Add chapters from your past that shaped you (optional but helps).
            </p>
            {pastStates.map((p, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-md bg-black/20 p-3">
                <input
                  className={inputClass}
                  placeholder="What happened / where you were"
                  value={p.summary}
                  onChange={(e) => {
                    const next = [...pastStates];
                    next[i] = { ...next[i], summary: e.target.value };
                    setPastStates(next);
                  }}
                />
                <input
                  className={inputClass}
                  placeholder="When (e.g. 2022) — optional"
                  value={p.asOf}
                  onChange={(e) => {
                    const next = [...pastStates];
                    next[i] = { ...next[i], asOf: e.target.value };
                    setPastStates(next);
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              className="self-start text-sm text-[var(--color-accent)] hover:underline"
              onClick={() =>
                setPastStates([...pastStates, { summary: "", asOf: "" }])
              }
            >
              + Add another chapter
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <label className="text-sm text-[var(--color-muted)]">Goal title</label>
            <input
              className={inputClass}
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="e.g. Become a senior backend engineer"
            />
            <label className="text-sm text-[var(--color-muted)]">
              Describe the goal (optional)
            </label>
            <textarea
              className={inputClass}
              rows={3}
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-sm text-[var(--color-muted)]">
                  Target date
                </label>
                <input
                  type="date"
                  className={inputClass}
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-[var(--color-muted)]">
                  Budget ($)
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-[var(--color-muted)]">
                  Hours / week
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  className={inputClass}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            disabled={step === 0 || pending}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="rounded-md border border-white/15 px-4 py-2 disabled:opacity-40"
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="rounded-md bg-[var(--color-accent)] px-5 py-2 font-medium text-white hover:bg-[var(--color-accent-strong)]"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="rounded-md bg-[var(--color-accent)] px-5 py-2 font-medium text-white hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create path"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
