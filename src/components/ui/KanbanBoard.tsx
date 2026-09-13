"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { clsx } from "clsx";
import { TONE_BAR } from "@/lib/labels";
import type { StatusTone } from "@/lib/types";

export interface KanbanColumnSpec<S extends string> {
  key: S;
  label: string;
  tone: StatusTone;
  /** Shown under the column label — e.g. total value or a count qualifier. */
  meta?: string;
}

interface KanbanBoardProps<T, S extends string> {
  columns: KanbanColumnSpec<S>[];
  items: T[];
  itemKey: (item: T) => string;
  itemStage: (item: T) => S;
  renderCard: (item: T) => React.ReactNode;
  onMove: (itemKey: string, to: S) => void;
  emptyColumn?: (col: KanbanColumnSpec<S>) => React.ReactNode;
  className?: string;
}

/**
 * Drag-and-drop board. dnd-kit gives us a keyboard sensor for free, which
 * matters here — a board you can only operate with a mouse fails the brief's
 * keyboard requirement.
 */
export function KanbanBoard<T, S extends string>({
  columns,
  items,
  itemKey,
  itemStage,
  renderCard,
  onMove,
  emptyColumn,
  className,
}: KanbanBoardProps<T, S>) {
  const [dragging, setDragging] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const grouped = useMemo(() => {
    const map = new Map<S, T[]>();
    for (const col of columns) map.set(col.key, []);
    for (const item of items) {
      const stage = itemStage(item);
      const bucket = map.get(stage);
      if (bucket) bucket.push(item);
    }
    return map;
  }, [columns, items, itemStage]);

  const activeItem = dragging
    ? items.find((i) => itemKey(i) === dragging) ?? null
    : null;

  function handleStart(e: DragStartEvent) {
    setDragging(String(e.active.id));
  }

  function handleEnd(e: DragEndEvent) {
    setDragging(null);
    const over = e.over?.id;
    if (!over) return;
    const item = items.find((i) => itemKey(i) === String(e.active.id));
    if (!item) return;
    const target = String(over) as S;
    if (itemStage(item) !== target) onMove(String(e.active.id), target);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleStart}
      onDragEnd={handleEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className={clsx("scrollbar-slim flex gap-3 overflow-x-auto pb-2", className)}>
        {columns.map((col) => (
          <Column
            key={col.key}
            spec={col}
            count={grouped.get(col.key)?.length ?? 0}
            empty={emptyColumn?.(col)}
          >
            {(grouped.get(col.key) ?? []).map((item) => (
              <Card key={itemKey(item)} id={itemKey(item)}>
                {renderCard(item)}
              </Card>
            ))}
          </Column>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="w-[268px] rotate-1 rounded-md border border-solar/60 bg-surface shadow-[0_10px_24px_rgba(16,25,43,0.22)]">
            {renderCard(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column<S extends string>({
  spec,
  count,
  children,
  empty,
}: {
  spec: KanbanColumnSpec<S>;
  count: number;
  children: React.ReactNode;
  empty?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: spec.key });

  return (
    <section
      className={clsx(
        "flex w-[284px] shrink-0 flex-col rounded-md border bg-canvas-sunk/70 transition-colors",
        isOver ? "border-solar bg-solar-wash/60" : "border-rule",
      )}
    >
      <header className="shrink-0 border-b border-rule px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={clsx("h-3.5 w-[3px] rounded-full", TONE_BAR[spec.tone])} />
          <h3 className="flex-1 truncate text-sm font-semibold text-ink">{spec.label}</h3>
          <span className="tnum rounded bg-surface px-1.5 py-px text-micro font-semibold text-ink-soft">
            {count}
          </span>
        </div>
        {spec.meta && <p className="tnum mt-1 pl-[11px] text-micro text-muted">{spec.meta}</p>}
      </header>

      <div
        ref={setNodeRef}
        className="scrollbar-slim flex min-h-[140px] flex-1 flex-col gap-2 overflow-y-auto p-2"
      >
        {count === 0 ? empty ?? <ColumnEmpty /> : children}
      </div>
    </section>
  );
}

function ColumnEmpty() {
  return (
    <p className="px-2 py-6 text-tiny leading-relaxed text-faint">
      Nothing parked here. Drag a card over to move it into this stage.
    </p>
  );
}

function Card({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  return (
    <article
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={clsx(
        "group relative rounded border border-rule bg-surface transition-shadow",
        isDragging ? "opacity-35" : "hover:border-rule-firm hover:shadow-[0_1px_3px_rgba(16,25,43,0.09)]",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to another stage"
        className="absolute right-1 top-1 flex size-6 cursor-grab items-center justify-center rounded text-faint opacity-0 transition-opacity hover:bg-canvas-sunk hover:text-muted focus-visible:opacity-100 group-hover:opacity-100"
      >
        <GripVertical className="size-3.5" strokeWidth={2} />
      </button>
      {children}
    </article>
  );
}
