interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutProps {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
}

export function Donut({ data, size = 120, thickness = 22 }: DonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = data.map((d) => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const slice = { ...d, dash, gap: circumference - dash, offset, pct };
    offset += dash;
    return slice;
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={thickness}
        />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset + circumference / 4}
            style={{ transition: "stroke-dasharray .4s ease" }}
          />
        ))}
      </svg>
      <div className="donut-legend">
        {data.map((d) => (
          <div key={d.name} className="donut-legend__row">
            <div className="donut-legend__sw" style={{ background: d.color }} />
            <span className="donut-legend__name">{d.name}</span>
            <span className="donut-legend__val">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
