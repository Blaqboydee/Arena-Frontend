// REST client for solo mode (Trivia). Auth via the guest token bearer header.
import { BACKEND_URL, getGuestToken } from "../socket";
import type { AvatarColor } from "../types";

export type SoloQuestion = {
  index:     number;
  total:     number;
  q:         string;
  options:   string[];
  timeLimit: number;
};

export type SoloSummary = {
  score: number; correct: number; total: number;
  best: number; isNewBest: boolean; rank: number | null;
};

export type SoloLeaderboardEntry = {
  rank: number; userId: string; name: string;
  avatarColor: AvatarColor; avatar: string;
  score: number; correct: number; total: number;
};

export type StartResult = {
  ok: boolean; error?: string;
  sessionId?: string; total?: number; question?: SoloQuestion;
};

export type AnswerResult = {
  ok: boolean; error?: string;
  correct?: boolean; correctIndex?: number; points?: number; score?: number;
  index?: number; finished?: boolean;
  next?: SoloQuestion;
  summary?: SoloSummary;
  leaderboard?: SoloLeaderboardEntry[];
};

function authHeaders(json = false): HeadersInit {
  const token = getGuestToken();
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function startSoloTrivia(pack: string): Promise<StartResult> {
  const res = await fetch(`${BACKEND_URL}/api/solo/trivia/start`, {
    method: "POST", headers: authHeaders(true), body: JSON.stringify({ pack }),
  });
  if (!res.ok && res.status >= 500) return { ok: false, error: "Server error. Try again." };
  return res.json();
}

export async function answerSoloTrivia(sessionId: string, choice: number): Promise<AnswerResult> {
  const res = await fetch(`${BACKEND_URL}/api/solo/trivia/answer`, {
    method: "POST", headers: authHeaders(true), body: JSON.stringify({ sessionId, choice }),
  });
  if (!res.ok && res.status >= 500) return { ok: false, error: "Server error. Try again." };
  return res.json();
}

export async function fetchSoloLeaderboard(limit = 25) {
  const res = await fetch(`${BACKEND_URL}/api/solo/trivia/leaderboard?limit=${limit}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{ ok: boolean; entries: SoloLeaderboardEntry[] }>;
}
