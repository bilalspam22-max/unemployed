"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { type ReactNode, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Column ───────────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  id: string;
  title: string;
  dotColor: string;
  count: number;
  children: ReactNode;
}

export function KanbanColumn({ id, title, dotColor, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`kanban-col ${isOver ? "is-drop-target" : ""}`}
    >
      <div className="kanban-col__head">
        <span className="kanban-col__title">
          <span className="col-dot" style={{ background: dotColor }} />
          {title}
        </span>
        <span className="kanban-col__count">{count}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface KanbanCardWrapperProps {
  id: string;
  children: ReactNode;
  onClick?: () => void;
}

export function KanbanCardWrapper({ id, children, onClick }: KanbanCardWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? "is-dragging" : ""}`}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ─── Mobile tabbed view ───────────────────────────────────────────────────────

interface MobileKanbanProps<T extends { id: string; status: string }> {
  items: T[];
  columns: Array<{ id: string; title: string; dotColor: string }>;
  onStatusChange: (itemId: string, newStatus: string) => void;
  renderCard: (item: T) => ReactNode;
}

function MobileKanban<T extends { id: string; status: string }>({
  items,
  columns,
  onStatusChange,
  renderCard,
}: MobileKanbanProps<T>) {
  const [activeTab, setActiveTab] = useState(columns[0]?.id ?? "");
  const activeItems = items.filter((i) => i.status === activeTab);
  const activeIdx = columns.findIndex((c) => c.id === activeTab);

  return (
    <div className="kanban-mobile-tabs">
      {/* Tabs */}
      <div className="kanban-mobile-tabs__bar">
        {columns.map((col) => {
          const count = items.filter((i) => i.status === col.id).length;
          return (
            <button
              key={col.id}
              className={`kanban-mobile-tab ${activeTab === col.id ? "kanban-mobile-tab--active" : ""}`}
              onClick={() => setActiveTab(col.id)}
            >
              <span className="kanban-mobile-tab__dot" style={{ background: col.dotColor }} />
              {col.title}
              {count > 0 && <span className="kanban-mobile-tab__count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Cards list */}
      <div className="kanban-mobile-list">
        {activeItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 13 }}>
            Aucune carte dans cette colonne
          </div>
        )}
        {activeItems.map((item) => {
          const prevCol = activeIdx > 0 ? columns[activeIdx - 1] : null;
          const nextCol = activeIdx < columns.length - 1 ? columns[activeIdx + 1] : null;

          return (
            <div key={item.id} className="kanban-mobile-card">
              {renderCard(item)}
              <div className="kanban-mobile-card__actions">
                {prevCol && (
                  <button
                    className="kanban-move-btn"
                    onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, prevCol.id); }}
                  >
                    <ChevronLeft size={12} /> {prevCol.title}
                  </button>
                )}
                {nextCol && (
                  <button
                    className="kanban-move-btn"
                    onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, nextCol.id); }}
                  >
                    {nextCol.title} <ChevronRight size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────

interface KanbanBoardProps<T extends { id: string; status: string }> {
  items: T[];
  columns: Array<{ id: string; title: string; dotColor: string }>;
  onStatusChange: (itemId: string, newStatus: string) => void;
  renderCard: (item: T) => ReactNode;
}

export function KanbanBoard<T extends { id: string; status: string }>({
  items,
  columns,
  onStatusChange,
  renderCard,
}: KanbanBoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (over && active.id !== over.id) {
      const newStatus = over.id as string;
      if (columns.some((c) => c.id === newStatus)) {
        onStatusChange(active.id as string, newStatus);
      }
    }
  }

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  return (
    <>
      {/* Desktop: DnD Kanban */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="kanban-shell">
          {columns.map((col) => {
            const colItems = items.filter((i) => i.status === col.id);
            return (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                dotColor={col.dotColor}
                count={colItems.length}
              >
                {colItems.map((item) => (
                  <KanbanCardWrapper key={item.id} id={item.id}>
                    {renderCard(item)}
                  </KanbanCardWrapper>
                ))}
              </KanbanColumn>
            );
          })}
        </div>
        <DragOverlay>
          {activeItem ? (
            <div className="kanban-card" style={{ opacity: 0.9, boxShadow: "var(--sh-3)" }}>
              {renderCard(activeItem)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Mobile: Tabbed list */}
      <MobileKanban
        items={items}
        columns={columns}
        onStatusChange={onStatusChange}
        renderCard={renderCard}
      />
    </>
  );
}
