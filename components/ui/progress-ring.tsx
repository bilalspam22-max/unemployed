"use client";

import { useEffect, useState } from "react";

interface ProgressRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ProgressRing({ score, size = 100, strokeWidth = 8, label = "Score" }: ProgressRingProps) {
  const [offset, setOffset] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
    }, 200);
    return () => clearTimeout(t);
  }, [score, circumference]);

  const color =
    score >= 70 ? "var(--success)" : score >= 40 ? "var(--warn)" : "var(--danger)";

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg className="progress-ring__svg" width={size} height={size}>
        <circle
          className="progress-ring__bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset === 0 ? circumference : offset}
        />
      </svg>
      <div className="progress-ring__center">
        <div className="progress-ring__value">{score}</div>
        <div className="progress-ring__label">{label}</div>
      </div>
    </div>
  );
}
