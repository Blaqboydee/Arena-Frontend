// REST client for the Daily Challenge API. Identifies the player with their
// guest token (same secret the socket handshake uses), sent as a bearer header.
import { BACKEND_URL, getGuestToken } from "../socket";
import type { AvatarColor } from "../types";

export type Grade = "correct" | "present" | "absent";

export type DailyGuess = { word: string; grade: Grade[] };

export type DailyState = {
  date:        string;
  number:      number;
  gameType:    string;
  wordLength:  number;
  maxAttempts: number;
  guesses:     DailyGuess[];
  attempts:    number;
  solved:      boolean;
  finished:    boolean;
  score?:      number;
  timeMs?:     number;
  answer?:     string; // only present once finished
};

export type DailyStatus = {
  ok:         boolean;
  available:  boolean;
  state:      DailyState;
  streak:     number;
  bestStreak: number;
};

export type GuessResult = {
  ok:         boolean;
  error?:     string;
  state?:     DailyState;
  streak?:    number;
  bestStreak?: number;
  rank?:      number | null;
};

export type DailyLeaderboardEntry = {
  rank:        number;
  userId:      string;
  name:        string;
  avatarColor: AvatarColor;
  avatar:      string;
  solved:      boolean;
  guesses:     number;
  timeMs:      number;
};

export type DailyLeaderboard = {
  ok:      boolean;
  date:    string;
  number:  number;
  entries: DailyLeaderboardEntry[];
};

function authHeaders(): HeadersInit {
  const token = getGuestToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchDaily(): Promise<DailyStatus> {
  const res = await fetch(`${BACKEND_URL}/api/daily`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function submitDailyGuess(guess: string): Promise<GuessResult> {
  const res = await fetch(`${BACKEND_URL}/api/daily/guess`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body:    JSON.stringify({ guess }),
  });
  if (!res.ok && res.status >= 500) return { ok: false, error: "Server error. Try again." };
  return res.json();
}

export async function fetchDailyLeaderboard(limit = 50): Promise<DailyLeaderboard> {
  const res = await fetch(`${BACKEND_URL}/api/daily/leaderboard?limit=${limit}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
