"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { clsx } from "clsx";

export interface Column<T> {
  key: string;
  header: string;
  /** Cell renderer. Return a string/number for plain text cells. */
  cell: (row: T) => React.ReactNode;
  /** Value used for sorting; omit to make the column unsortable. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  /** Currency/kWh/date columns get tabular figures. */
  numeric?: boolean;
  width?: string;
  /** Hide below the md breakpoint to keep mobile readable. */
  hideBelow?: "sm" | "md" | "lg";
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Row currently open in a detail panel. */
  activeRowKey?: string | null;
  empty: React.ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
  className?: string;
}

const HIDE: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  activeRowKey,
  empty,
  initialSort,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(
    initialSort ?? null,
  );

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
      return String(av).localeCompare(String(bv)) * factor;
    });
  }, [rows, columns, sort]);

  function toggle(key: string) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }

  if (rows.length === 0) {
    return (
      <div className={clsx("rounded-md border border-rule bg-surface", className)}>{empty}</div>
    );
  }

  return (
    <div
      className={clsx(
        "scrollbar-slim overflow-x-auto rounded-md border border-rule bg-surface",
        className,
      )}
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-rule bg-canvas-sunk/60">
            {columns.map((col) => {
              const isSorted = sort?.key === col.key;
              const sortable = Boolean(col.sortValue);
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={clsx(
                    "px-3 py-2 text-tiny font-semibold text-ink-soft",
                    col.align === "right" && "text-right",
                    col.hideBelow && HIDE[col.hideBelow],
                  )}
                  aria-sort={isSorted ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggle(col.key)}
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded transition-colors hover:text-ink",
                        col.align === "right" && "flex-row-reverse",
                      )}
                    >
                      {col.header}
                      {isSorted ? (
                        sort!.dir === "asc" ? (
                          <ArrowUp className="size-3 text-solar-hot" strokeWidth={2.25} />
                        ) : (
                          <ArrowDown className="size-3 text-solar-hot" strokeWidth={2.25} />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 text-faint" strokeWidth={2} />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const key = rowKey(row);
            const active = activeRowKey === key;
            const clickable = Boolean(onRowClick);
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                tabIndex={clickable ? 0 : undefined}
                role={clickable ? "button" : undefined}
                aria-current={active ? "true" : undefined}
                className={clsx(
                  "border-b border-rule/70 last:border-0",
                  clickable && "cursor-pointer transition-colors hover:bg-solar-wash/45",
                  active && "bg-solar-wash",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      "px-3 py-2.5 align-middle text-ink-soft",
                      col.align === "right" && "text-right",
                      col.numeric && "tnum",
                      col.hideBelow && HIDE[col.hideBelow],
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Filter/search bar that sits directly above a table. */
export function TableToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mb-3 flex flex-wrap items-center gap-2", className)}>{children}</div>
  );
}

export function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-2 text-tiny text-muted">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded border border-rule-firm bg-surface px-2 text-sm text-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
