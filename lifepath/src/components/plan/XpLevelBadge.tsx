import { createClient } from "@/lib/supabase/server";
import { loadProfileXp } from "@/lib/plan/progress";
import { levelProgress } from "@/lib/domain/xp";

/**
 * Compact level + XP indicator for the app header. Reads the caller's profile
 * (RLS-scoped) and shows progress toward the next level.
 */
export async function XpLevelBadge() {
  const supabase = await createClient();
  const profile = await loadProfileXp(supabase);
  if (!profile) return null;

  const { level, xpToNext, fraction } = levelProgress(profile.totalXp);
  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 100);

  return (
    <div
      className="flex items-center gap-2"
      aria-label={`Level ${level}, ${profile.totalXp} total XP, ${xpToNext} XP to the next level`}
    >
      <span className="rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
        Lv {level}
      </span>
      <div className="hidden sm:flex sm:flex-col sm:gap-1">
        <div
          className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-[var(--color-accent)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-[var(--color-muted)]">
          {profile.totalXp} XP
        </span>
      </div>
    </div>
  );
}
