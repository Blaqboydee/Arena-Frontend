import { type HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  brackets?: boolean;   // corner bracket decoration
  glow?: boolean;       // subtle amber glow border on hover
  padded?: boolean;     // default internal padding
};

export default function Card({
  brackets = false,
  glow = false,
  padded = true,
  className = "",
  children,
  ...props
}: Props) {
  return (
    <div
      className={`
        relative bg-surface border border-border rounded-sm
        ${padded ? "p-6" : ""}
        ${brackets ? "bracket-card" : ""}
        ${glow ? "hover:border-amber/40 hover:shadow-[0_0_24px_rgba(245,166,35,0.08)] transition-all duration-300" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}