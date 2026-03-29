import type { AvatarColor } from "../../types";

type Size = "sm" | "md" | "lg" | "xl";

type Props = {
  name: string;
  color: AvatarColor;
  size?: Size;
  className?: string;
};

const colorMap: Record<AvatarColor, { bg: string; text: string; ring: string }> = {
  amber:   { bg: "bg-amber/20",   text: "text-amber",   ring: "ring-amber/40"   },
  cyan:    { bg: "bg-cyan-400/20",  text: "text-cyan-400",  ring: "ring-cyan-400/40"  },
  rose:    { bg: "bg-rose-400/20",  text: "text-rose-400",  ring: "ring-rose-400/40"  },
  violet:  { bg: "bg-violet-400/20",text: "text-violet-400",ring: "ring-violet-400/40"},
  emerald: { bg: "bg-emerald-400/20",text:"text-emerald-400",ring:"ring-emerald-400/40"},
  sky:     { bg: "bg-sky-400/20",   text: "text-sky-400",   ring: "ring-sky-400/40"   },
};

const sizeMap: Record<Size, { wrapper: string; text: string }> = {
  sm: { wrapper: "w-7 h-7 text-xs",  text: "" },
  md: { wrapper: "w-9 h-9 text-sm",  text: "" },
  lg: { wrapper: "w-12 h-12 text-base", text: "" },
  xl: { wrapper: "w-16 h-16 text-xl",   text: "" },
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Avatar({ name, color, size = "md", className = "" }: Props) {
  const c = colorMap[color];
  const s = sizeMap[size];

  return (
    <div
      className={`
        ${s.wrapper} ${c.bg} ${c.text}
        flex items-center justify-center
        rounded-sm font-display font-bold
        ring-1 ${c.ring}
        select-none shrink-0
        ${className}
      `}
    >
      {initials(name)}
    </div>
  );
}