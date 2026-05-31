"use client";

import { useEffect, useState } from "react";

interface FunnelStage {
  label: string;
  count: number;
  color: string;
}

interface PipelineFunnelProps {
  stages: FunnelStage[];
}

export function PipelineFunnel({ stages }: PipelineFunnelProps) {
  const [animated, setAnimated] = useState(false);
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="funnel">
      {stages.map((stage, idx) => {
        const pct = Math.round((stage.count / maxCount) * 100);
        const nextCount = stages[idx + 1]?.count;
        const convRate =
          nextCount !== undefined && stage.count > 0
            ? Math.round((nextCount / stage.count) * 100)
            : null;

        return (
          <div
            key={stage.label}
            className="funnel__row"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="funnel__label">{stage.label}</div>
            <div className="funnel__bar-track">
              <div
                className="funnel__bar-fill"
                style={{
                  width: animated ? `${Math.max(pct, 8)}%` : "0%",
                  background: stage.color,
                  transitionDelay: `${idx * 80}ms`,
                }}
              >
                {stage.count > 0 && (
                  <span className="funnel__bar-value">{stage.count}</span>
                )}
              </div>
            </div>
            <div className="funnel__rate">
              {convRate !== null ? `${convRate}%` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
