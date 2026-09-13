import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  // Solar gold is reserved for this. Nothing else in the UI uses it as a fill.
  primary:
    "bg-solar text-[#241704] hover:bg-solar-hot border border-solar-hot/60 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
  secondary: "bg-surface text-ink border border-rule-firm hover:bg-canvas-sunk font-medium",
  ghost: "bg-transparent text-ink-soft hover:bg-canvas-sunk hover:text-ink border border-transparent font-medium",
  danger: "bg-danger-wash text-danger border border-danger/30 hover:bg-[#f7ddda] font-medium",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 px-2.5 text-tiny gap-1.5",
  md: "h-8.5 px-3 text-sm gap-2",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded transition-colors",
        "disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}

/** Small square icon button for table rows and panel headers. */
export function IconButton({
  className,
  type = "button",
  label,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex size-7 shrink-0 items-center justify-center rounded border border-transparent",
        "text-muted transition-colors hover:border-rule-firm hover:bg-canvas-sunk hover:text-ink",
        className,
      )}
      {...rest}
    />
  );
}
