import { clsx } from "clsx";

interface PageHeaderProps {
  title: string;
  /** One line answering "what is this screen for" in plain terms. */
  lede?: string;
  actions?: React.ReactNode;
  /** Segmented view switcher (list/kanban, calendar/list) sits under the title. */
  tabs?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, lede, actions, tabs, className }: PageHeaderProps) {
  return (
    <header className={clsx("border-b border-rule bg-canvas px-5 pt-5 pb-0 sm:px-7", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">{title}</h1>
          {lede && <p className="mt-1 max-w-2xl text-sm text-muted">{lede}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {tabs ? <div className="mt-4 flex items-end gap-1">{tabs}</div> : <div className="h-5" />}
    </header>
  );
}

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}

/** Underlined view switcher. Active state uses the accent sparingly. */
export function ViewTab({ active, onClick, children, count }: TabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors",
        active
          ? "border-solar font-semibold text-ink"
          : "border-transparent font-medium text-muted hover:border-rule-firm hover:text-ink",
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={clsx(
            "tnum rounded px-1.5 py-px text-micro font-semibold",
            active ? "bg-solar-wash text-solar-hot" : "bg-canvas-sunk text-muted",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/** Standard content wrapper — left-aligned, never centered. */
export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx("px-5 py-5 sm:px-7", className)}>{children}</div>;
}
