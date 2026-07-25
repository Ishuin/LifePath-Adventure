// XP / leveling math. The profile's global level is derived purely from its
// cumulative XP (the append-only xp_events ledger), never stored mutably — so
// undoing a step and recomputing always lands on the correct level.
//
// This MUST stay in lockstep with the SQL in supabase/migrations/0005_progress.sql.
// Curve: reaching level L costs `100 * (L-1) * L` cumulative XP. That yields a
// gently escalating requirement (0, 200, 600, 1200, 2000, …) and inverts to a
// closed form: level = floor((1 + sqrt(1 + xp / 25)) / 2), clamped to >= 1.

/** Cumulative XP required to reach a given level (level 1 requires 0). */
export function xpForLevel(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return 100 * (l - 1) * l;
}

/** The level a given cumulative XP total corresponds to (always >= 1). */
export function levelForXp(totalXp: number): number {
  const xp = Math.max(0, totalXp);
  const level = Math.floor((1 + Math.sqrt(1 + xp / 25)) / 2);
  return Math.max(1, level);
}

export interface LevelProgress {
  level: number;
  /** XP earned so far within the current level. */
  xpIntoLevel: number;
  /** XP span of the current level (from this level's floor to the next). */
  xpForThisLevel: number;
  /** XP still needed to reach the next level. */
  xpToNext: number;
  /** Fraction through the current level, 0–1. */
  fraction: number;
}

/**
 * Breaks a cumulative XP total into human-facing progress within the current
 * level — for progress bars and "N XP to level up" copy.
 */
export function levelProgress(totalXp: number): LevelProgress {
  const xp = Math.max(0, totalXp);
  const level = levelForXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const xpForThisLevel = ceil - floor;
  const xpIntoLevel = xp - floor;
  return {
    level,
    xpIntoLevel,
    xpForThisLevel,
    xpToNext: Math.max(0, ceil - xp),
    fraction: xpForThisLevel > 0 ? xpIntoLevel / xpForThisLevel : 0,
  };
}
