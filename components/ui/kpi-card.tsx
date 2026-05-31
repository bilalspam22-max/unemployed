"use client";

import { useEffect, useRef, useState } from "react";
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

// Animated count-up — only when value is numeric.
function useCountUp(target: number, durationMs = 700): number {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef  = useRef(0);

  useEffect(() => {
    fromRef.current = current;
    startRef.current = null;
    let frameId = 0;

    function tick(t: number) {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = fromRef.current + (target - fromRef.current) * eased;
      setCurrent(next);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return current;
}

function formatNumber(n: number, isInt: boolean): string {
  if (isInt) return Math.round(n).toLocaleString("fr-FR");
  return (Math.round(n * 10) / 10).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function KpiCard({ label, value, unit, delta, sparkData, sparkColor }: KpiCardProps) {
  const isNumeric = typeof value === "number" && !Number.isNaN(value);
  const animated  = useCountUp(isNumeric ? (value as number) : 0);
  const isUp = delta !== undefined && delta >= 0;

  // Determine if we should show integer vs decimal
  const showInt = isNumeric ? Number.isInteger(value as number) : true;
  const display = isNumeric ? formatNumber(animated, showInt) : String(value);

  return (
    <div className="kpi">
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{display}</span>
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
