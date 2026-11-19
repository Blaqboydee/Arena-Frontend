import type { AvatarColor } from "../types";

// Each color's lead hex — used to bias a player's generated avatar toward their
// chosen arena color so it feels personal.
const colorHex: Record<AvatarColor, string> = {
  amber:   "#F5A623",
  cyan:    "#22d3ee",
  rose:    "#fb7185",
  violet:  "#a78bfa",
  emerald: "#34d399",
  sky:     "#38bdf8",
};

const BASE_PALETTE = ["#F5A623", "#3dffa0", "#ff4d6d", "#38bdf8", "#a78bfa", "#e8e8e8"];

export function avatarPalette(color: AvatarColor): string[] {
  return [colorHex[color], ...BASE_PALETTE.filter((c) => c !== colorHex[color])];
}

// The gallery of avatar seeds players pick from.
export const AVATAR_SEEDS = [
  "blaze", "nova", "turbo", "echo", "ghost", "volt",
  "rune", "zephyr", "comet", "hydra", "onyx", "pixel",
];

// Deterministically derive an accent color from a seed, so each avatar keeps a
// consistent tint without the player choosing a color separately.
const COLORS: AvatarColor[] = ["amber", "cyan", "rose", "violet", "emerald", "sky"];

export function colorFromSeed(seed: string): AvatarColor {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}
