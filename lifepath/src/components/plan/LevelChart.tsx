import type { LevelMilestone } from "@/lib/plan/types";

/**
 * XP-to-level progression. The SVG is decorative (role="img" with a summary
 * label); the ordered milestone list beneath it is the accessible, always-shown
 * equivalent, so no data lives only in the chart.
 */
export function LevelChart({ levels }: { levels: LevelMilestone[] }) {
  if (levels.length === 0) return null;
  const sorted = [...levels].sort((a, b) => a.level - b.level);
  const maxXp = Math.max(1, ...sorted.map((l) => l.xpRequired));

  const W = 620;
  const H = 160;
  const padX = 16;
  const padY = 16;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const points = sorted.map((l, i) => {
    const x =
      sorted.length === 1
        ? padX + innerW / 2
        : padX + (innerW * i) / (sorted.length - 1);
    const y = padY + innerH - (innerH * l.xpRequired) / maxXp;
    return { x, y, level: l };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${padY + innerH} L ${points[0].x} ${padY + innerH} Z`
      : "";

  const summary = `Level progression from level ${sorted[0].level} to ${sorted[sorted.length - 1].level}, up to ${maxXp} XP.`;

  return (
    <div>
      {points.length > 1 && (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={summary}
          preserveAspectRatio="none"
        >
          {areaPath && (
            <path d={areaPath} fill="var(--color-accent)" opacity={0.12} />
          )}
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2}
          />
          {points.map((p) => (
            <circle
              key={p.level.id}
              cx={p.x}
              cy={p.y}
              r={3.5}
              fill="var(--color-accent)"
            />
          ))}
        </svg>
      )}

      <ol className="mt-4 space-y-2">
        {sorted.map((l) => (
          <li
            key={l.id}
            className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2 last:border-0"
          >
            <span className="min-w-0">
              <span className="text-sm font-medium">
                <span className="text-[var(--color-accent)]">Lv {l.level}</span>{" "}
                {l.title}
              </span>
              {l.unlocks && (
                <span className="block text-xs text-[var(--color-muted)]">
                  Unlocks: {l.unlocks}
                </span>
              )}
            </span>
            <span className="shrink-0 text-xs text-[var(--color-muted)]">
              {l.xpRequired.toLocaleString()} XP
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
