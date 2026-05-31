"use client";

interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
}

interface ActivityHeatmapProps {
  days: HeatmapDay[];
  totalActions: number;
}

function getLevel(count: number): string {
  if (count === 0) return "";
  if (count <= 2) return "heatmap__cell--l1";
  if (count <= 4) return "heatmap__cell--l2";
  if (count <= 6) return "heatmap__cell--l3";
  return "heatmap__cell--l4";
}

export function ActivityHeatmap({ days, totalActions }: ActivityHeatmapProps) {
  // Build 91 days (13 weeks) grid ending today
  const today = new Date();
  const cells: HeatmapDay[] = [];
  const dayMap = new Map(days.map((d) => [d.date, d.count]));

  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    cells.push({ date: dateStr, count: dayMap.get(dateStr) ?? 0 });
  }

  return (
    <div className="heatmap">
      <div className="heatmap__grid">
        {cells.map((cell) => (
          <div
            key={cell.date}
            className={`heatmap__cell ${getLevel(cell.count)}`}
            data-tooltip={`${cell.date}: ${cell.count} action${cell.count !== 1 ? "s" : ""}`}
          />
        ))}
      </div>
      <div className="heatmap__meta">
        <div className="heatmap__total">{totalActions}</div>
        <div className="heatmap__label">actions (90j)</div>
      </div>
    </div>
  );
}
