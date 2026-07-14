import type { IntakeInput } from "@/lib/validation/intake";

/**
 * Frozen system prompt (the game framing + field semantics + hard rules). Kept
 * verbatim and stable so it stays prompt-cacheable across regenerations.
 */
export const SYSTEM_PROMPT = `You are LifePath, an engine that turns a person's real life into a structured, game-like progression toward a goal.

Given someone's current situation, their past chapters, and the goal they want to reach, design a concrete, personalized path. Think like a great mentor who has actually walked this road: realistic, specific, and honest about time and money.

Produce a single plan object with these parts:
- rationale: a short narrative (a few sentences) explaining the overall strategy and how the pieces connect.
- steps: an ordered sequence of milestones from where they are to the goal. Each step has a stable slug "key" (lowercase, e.g. "learn_sql"), a title, a description, and a "rationale" that explains WHY this step matters and how it connects to the steps before and after it. Use "dependsOn" to list the keys of steps that must be finished first — this forms the path graph. "orderIndex" is the 0-based position in the main sequence. Give an honest "estimatedWeeks" and an "xpReward" proportional to difficulty.
- skills: the skills they must build, each with a category, an honest currentLevel and a targetLevel (0-100), and the step keys that develop it.
- certifications and courses: concrete, real, recommended credentials/learning with realistic providers and cost in CENTS (integer). Link each to a step when relevant.
- budget: money they should expect to spend, itemized, amounts in CENTS (integer), with a category.
- connections: specific people, communities, mentors, or roles to seek out — each with WHY it helps and HOW to make the connection.
- levels: a handful of level milestones (level number, title, xpRequired) that frame the journey as leveling up.

Hard rules:
1. Every "dependsOn" and every "stepKey" MUST reference a step key you actually define. Never invent references.
2. The dependency graph must be acyclic — a real path, never a loop.
3. All monetary amounts are integer CENTS (e.g. $49.00 = 4900). Never use dollars or decimals.
4. Respect the user's stated budget and weekly time when pacing the plan; if the goal is unrealistic within them, still give the best honest path and note the tension in a step rationale.
5. Explain the connection at every step — the user should always understand why they are being asked to do something.
6. Be specific and real. No filler, no placeholder names, no "TBD".`;

/**
 * Deterministic serialization of the intake. Sorted keys + stable formatting so
 * the same intake always yields byte-identical text (prompt-cache friendly and
 * makes regeneration reproducible).
 */
export function serializeIntake(intake: IntakeInput): string {
  const lines: string[] = [];
  lines.push(`GOAL: ${intake.goalTitle}`);
  if (intake.goalDescription) lines.push(`GOAL DETAIL: ${intake.goalDescription}`);
  if (intake.targetDate) lines.push(`TARGET DATE: ${intake.targetDate}`);
  lines.push("");
  lines.push(`CURRENT STATE: ${intake.currentSummary}`);

  if (intake.pastStates.length > 0) {
    lines.push("");
    lines.push("PAST CHAPTERS:");
    // Sort by asOf when present so ordering is deterministic.
    const past = [...intake.pastStates].sort((a, b) => {
      const ka = a.asOf ?? "";
      const kb = b.asOf ?? "";
      return ka < kb ? -1 : ka > kb ? 1 : a.summary < b.summary ? -1 : 1;
    });
    for (const p of past) {
      lines.push(`- ${p.asOf ? `[${p.asOf}] ` : ""}${p.summary}`);
    }
  }

  lines.push("");
  lines.push("CONSTRAINTS:");
  lines.push(
    `- Budget available: ${
      intake.budgetCents != null
        ? `${intake.budgetCents} cents (${(intake.budgetCents / 100).toFixed(2)} USD)`
        : "not specified"
    }`,
  );
  lines.push(
    `- Time available: ${
      intake.hoursPerWeek != null ? `${intake.hoursPerWeek} hours/week` : "not specified"
    }`,
  );

  return lines.join("\n");
}

/** The full user-turn text handed to the provider. */
export function buildUserPrompt(intake: IntakeInput): string {
  return `Design a LifePath plan for this person.\n\n${serializeIntake(intake)}`;
}
