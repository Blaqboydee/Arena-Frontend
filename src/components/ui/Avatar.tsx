import BoringAvatar from "boring-avatars";
import type { AvatarColor } from "../../types";
import { avatarPalette } from "../../lib/avatar";

type Size = "sm" | "md" | "lg" | "xl";

type Props = {
  name: string;
  color: AvatarColor;
  /** boring-avatars seed; falls back to `name` when empty. */
  seed?: string;
  size?: Size;
  className?: string;
};

// Ring accent per color (keeps the player's color identity around the avatar).
const ringMap: Record<AvatarColor, string> = {
  amber:   "ring-amber/40",
  cyan:    "ring-cyan-400/40",
  rose:    "ring-rose-400/40",
  violet:  "ring-violet-400/40",
  emerald: "ring-emerald-400/40",
  sky:     "ring-sky-400/40",
};

const sizeMap: Record<Size, { wrapper: string; px: number }> = {
  sm: { wrapper: "w-7 h-7",   px: 28 },
  md: { wrapper: "w-9 h-9",   px: 36 },
  lg: { wrapper: "w-12 h-12", px: 48 },
  xl: { wrapper: "w-16 h-16", px: 64 },
};

export default function Avatar({ name, color, seed, size = "md", className = "" }: Props) {
  const s = sizeMap[size];
  const avatarSeed = seed && seed.length ? seed : name || "arena";
  const palette = avatarPalette(color);

  return (
    <div
      className={`${s.wrapper} rounded-sm ring-1 ${ringMap[color]} overflow-hidden shrink-0 bg-elevated select-none ${className}`}
    >
      <BoringAvatar
        size={s.px}
        name={avatarSeed}
        variant="beam"
        colors={palette}
        square
      />
    </div>
  );
}
