import type { GeneratedPlan } from "./schema";

/**
 * Semantic validation that Zod can't express: unique step keys, dependency
 * references resolving to real steps, no self/cyclic dependencies, and every
 * `stepKey` on skills/certs/courses/budget/connections pointing at a real step.
 *
 * Returns a list of human-readable problems (empty = valid). These messages are
 * fed back to the model on the repair-retry, so keep them specific.
 */
export function validatePlan(plan: GeneratedPlan): string[] {
  const errors: string[] = [];

  const keys = plan.steps.map((s) => s.key);
  const keySet = new Set<string>();
  for (const k of keys) {
    if (keySet.has(k)) errors.push(`Duplicate step key "${k}".`);
    keySet.add(k);
  }

  // Dependency references must resolve, and a step can't depend on itself.
  for (const step of plan.steps) {
    for (const dep of step.dependsOn) {
      if (dep === step.key) {
        errors.push(`Step "${step.key}" depends on itself.`);
      } else if (!keySet.has(dep)) {
        errors.push(
          `Step "${step.key}" depends on unknown step "${dep}".`,
        );
      }
    }
  }

  // Cycle detection over the dependency edges (dep -> step). Only run if refs
  // are otherwise sound, so a dangling ref doesn't masquerade as a cycle.
  if (errors.length === 0) {
    const cycle = findCycle(plan);
    if (cycle) errors.push(`Dependency cycle detected: ${cycle.join(" -> ")}.`);
  }

  // Cross-entity stepKey references.
  const refCheck = (
    label: string,
    items: { stepKey?: string | null }[],
  ) => {
    items.forEach((item, i) => {
      if (item.stepKey && !keySet.has(item.stepKey)) {
        errors.push(
          `${label}[${i}] references unknown step "${item.stepKey}".`,
        );
      }
    });
  };
  refCheck("certifications", plan.certifications);
  refCheck("courses", plan.courses);
  refCheck("budget", plan.budget);
  refCheck("connections", plan.connections);

  plan.skills.forEach((skill, i) => {
    for (const k of skill.stepKeys) {
      if (!keySet.has(k)) {
        errors.push(`skills[${i}] ("${skill.name}") references unknown step "${k}".`);
      }
    }
    if (skill.targetLevel < skill.currentLevel) {
      errors.push(
        `skills[${i}] ("${skill.name}") target level is below current level.`,
      );
    }
  });

  return errors;
}

/**
 * DFS cycle finder. Edges point prerequisite -> dependent; a cycle means the
 * path can never be completed. Returns the offending key path, or null.
 */
function findCycle(plan: GeneratedPlan): string[] | null {
  const adjacency = new Map<string, string[]>();
  for (const step of plan.steps) {
    adjacency.set(step.key, step.dependsOn);
  }

  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map<string, number>();
  const stack: string[] = [];

  function visit(node: string): string[] | null {
    color.set(node, GRAY);
    stack.push(node);
    for (const next of adjacency.get(node) ?? []) {
      const c = color.get(next) ?? WHITE;
      if (c === GRAY) {
        // Found a back-edge; slice the stack to show the cycle.
        const start = stack.indexOf(next);
        return [...stack.slice(start), next];
      }
      if (c === WHITE) {
        const found = visit(next);
        if (found) return found;
      }
    }
    stack.pop();
    color.set(node, BLACK);
    return null;
  }

  for (const step of plan.steps) {
    if ((color.get(step.key) ?? WHITE) === WHITE) {
      const found = visit(step.key);
      if (found) return found;
    }
  }
  return null;
}
