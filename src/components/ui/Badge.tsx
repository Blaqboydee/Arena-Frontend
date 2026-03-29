type Variant = "amber" | "green" | "red" | "muted" | "dim";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  dot?: boolean;
  className?: string;
};

const variantClasses: Record<Variant, string> = {
  amber: "bg-amber/10 text-amber border-amber/30",
  green: "bg-green/10 text-green border-green/30",
  red:   "bg-red/10   text-red   border-red/30",
  muted: "bg-elevated text-muted border-border",
  dim:   "bg-bg       text-dim   border-border",
};

const dotClasses: Record<Variant, string> = {
  amber: "bg-amber",
  green: "bg-green",
  red:   "bg-red",
  muted: "bg-muted",
  dim:   "bg-dim",
};

export default function Badge({
  children,
  variant = "muted",
  dot = false,
  className = "",
}: Props) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        border rounded-sm px-2 py-0.5
        font-mono text-[10px] tracking-widest uppercase
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses[variant]}`}
        />
      )}
      {children}
    </span>
  );
}