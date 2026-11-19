// Map an ELO rating to a rank tier. Starting rating is 1000 (Bronze).
export type Tier = { name: string; color: string; min: number };

const TIERS: Tier[] = [
  { name: "Diamond",  color: "#7dd3fc", min: 1600 },
  { name: "Platinum", color: "#6ee7b7", min: 1400 },
  { name: "Gold",     color: "#F5A623", min: 1200 },
  { name: "Silver",   color: "#cbd5e1", min: 1050 },
  { name: "Bronze",   color: "#cd7f4d", min: 0 },
];

export function tierForRating(rating: number): Tier {
  return TIERS.find((t) => rating >= t.min) ?? TIERS[TIERS.length - 1];
}
