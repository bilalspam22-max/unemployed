import { type CSSProperties } from "react";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ width = "100%", height = 16, radius = 6, className = "", style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

// ─── Pre-composed skeletons for common layouts ─────────────────────────────

export function KpiSkeleton() {
  return (
    <div className="kpi">
      <Skeleton width={120} height={12} />
      <div style={{ marginTop: 8 }}>
        <Skeleton width={80} height={32} />
      </div>
      <div style={{ marginTop: 8 }}>
        <Skeleton width={50} height={11} />
      </div>
    </div>
  );
}

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="kpi-grid">
      {Array.from({ length: count }).map((_, i) => <KpiSkeleton key={i} />)}
    </div>
  );
}

export function CardSkeleton({ height = 120 }: { height?: number }) {
  return (
    <div className="card card__pad-lg">
      <Skeleton width={140} height={11} />
      <div style={{ marginTop: 14 }}>
        <Skeleton width="100%" height={height - 40} radius={10} />
      </div>
    </div>
  );
}

export function KanbanSkeleton({ columns = 6, cardsPerCol = 2 }: { columns?: number; cardsPerCol?: number }) {
  return (
    <div className="kanban-shell">
      {Array.from({ length: columns }).map((_, ci) => (
        <div key={ci} className="kanban-col">
          <div className="kanban-col__head">
            <Skeleton width={120} height={12} />
            <Skeleton width={24} height={16} radius={999} />
          </div>
          {Array.from({ length: cardsPerCol }).map((_, idx) => (
            <div key={idx} className="kanban-card" style={{ pointerEvents: "none" }}>
              <Skeleton width="70%" height={14} />
              <div style={{ marginTop: 8 }}>
                <Skeleton width="50%" height={11} />
              </div>
              <div style={{ marginTop: 8 }}>
                <Skeleton width="40%" height={10} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="contact-row" style={{ pointerEvents: "none" }}>
          <Skeleton width={32} height={32} radius={999} />
          <div>
            <Skeleton width={140} height={13} />
            <div style={{ marginTop: 6 }}><Skeleton width={100} height={11} /></div>
          </div>
          <Skeleton width={80} height={11} />
          <Skeleton width={80} height={11} />
          <Skeleton width={60} height={11} />
          <Skeleton width={70} height={24} radius={6} />
        </div>
      ))}
    </div>
  );
}

export function GridCardSkeleton({ cols = 3, rows = 2 }: { cols?: number; rows?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div key={i} className="card card__pad-lg">
          <Skeleton width="60%" height={16} />
          <div style={{ marginTop: 12 }}><Skeleton width="90%" height={11} /></div>
          <div style={{ marginTop: 8 }}><Skeleton width="40%" height={11} /></div>
          <div style={{ marginTop: 16 }}><Skeleton width="100%" height={36} radius={8} /></div>
        </div>
      ))}
    </div>
  );
}
