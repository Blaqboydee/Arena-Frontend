// REST client for the stats API (leaderboards + profiles).
// Uses the same BACKEND_URL as the socket; in dev, "" falls through Vite's proxy.
import { BACKEND_URL } from "../socket";
import type { GameType, AvatarColor } from "../types";

export type LeaderboardPlayer = {
  rank: number;
  id: string;
  displayName: string;
  avatarColor: AvatarColor;
  avatar: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  winRate: number;
};

export type GameStat = {
  gameType: GameType;
  wins: number;
  losses: number;
  draws: number;
  played: number;
  winRate: number;
};

export type MatchResult = "win" | "loss" | "draw" | "forfeit";

export type RecentMatch = {
  gameType: GameType;
  result: MatchResult;
  score: number;
  ratingDelta: number | null;
  status: "completed" | "abandoned";
  endedAt: string;
};

export type Profile = {
  user: {
    id: string;
    displayName: string;
    avatarColor: AvatarColor;
    avatar: string;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
    gamesPlayed: number;
    winRate: number;
    isGuest: boolean;
    createdAt: string;
  };
  gameStats: GameStat[];
  recentMatches: RecentMatch[];
};

export type Summary = { totalPlayers: number; totalMatches: number };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export function fetchLeaderboard(game: string = "all", limit = 50) {
  return get<{ game: string; players: LeaderboardPlayer[] }>(
    `/api/leaderboard?game=${encodeURIComponent(game)}&limit=${limit}`
  );
}

export function fetchProfile(id: string) {
  return get<Profile>(`/api/users/${encodeURIComponent(id)}`);
}

export function fetchSummary() {
  return get<Summary>(`/api/stats/summary`);
}

export type TriviaPack = { id: string; label: string; icon: string; count: number };

export function fetchTriviaPacks() {
  return get<{ packs: TriviaPack[] }>(`/api/trivia/packs`);
}
