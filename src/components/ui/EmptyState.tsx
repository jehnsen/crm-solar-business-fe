import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface EmptyStateProps {
  icon?: LucideIcon;
  /** What's missing, in the office's own words. */
  title: string;
  /** What action fills it. */
  body: string;
  action?: React.ReactNode;
  className?: string;
  /** Left-aligned by default; tables center theirs inside the frame. */
  align?: "left" | "center";
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
  align = "left",
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-2 px-5 py-10",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {Icon && (
        <span className="mb-1 flex size-9 items-center justify-center rounded border border-rule bg-canvas-sunk text-muted">
          <Icon className="size-[18px]" strokeWidth={1.75} />
        </span>
      )}
      <p className="text-lg font-semibold text-ink">{title}</p>
      <p className={clsx("text-sm leading-relaxed text-muted", align === "left" && "max-w-prose")}>
        {body}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
