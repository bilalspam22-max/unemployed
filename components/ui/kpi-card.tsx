import { TrendingUp, TrendingDown } from "lucide-react";
import { Sparkline } from "./sparkline";

interface KpiCardProps {
  label: string;
  value: number | string;
  unit?: string;
  delta?: number;
  sparkData?: number[];
  sparkColor?: string;
}

export function KpiCard({ label, value, unit, delta, sparkData, sparkColor }: KpiCardProps) {
  const isUp = delta !== undefined && delta >= 0;
  return (
    <div className="kpi">
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">
        {value}
        {unit && <span className="kpi__unit">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div className={`kpi__delta ${isUp ? "" : "kpi__delta--down"}`}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isUp ? "+" : ""}{delta}{unit === "%" ? "pp" : ""}
        </div>
      )}
      {sparkData && (
        <div className="kpi__spark">
          <Sparkline data={sparkData} color={sparkColor ?? "var(--primary)"} />
        </div>
      )}
    </div>
  );
}
