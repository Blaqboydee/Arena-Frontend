import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-amber text-bg font-display tracking-wide2 uppercase " +
    "hover:bg-amber-dim active:scale-95 " +
    "disabled:bg-dim disabled:text-muted disabled:cursor-not-allowed",
  secondary:
    "bg-transparent text-amber border border-amber font-display tracking-wide2 uppercase " +
    "hover:bg-amber-glow active:scale-95 " +
    "disabled:border-dim disabled:text-muted disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-muted font-mono text-sm " +
    "hover:text-text hover:bg-elevated active:scale-95",
  danger:
    "bg-transparent text-red border border-red font-display tracking-wide2 uppercase " +
    "hover:bg-red/10 active:scale-95",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-sm transition-all duration-150 select-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}