import type { GameType } from "../types";

// Display metadata for every game type (icons mirror the lobby's GameCard).
export const GAME_META: Record<GameType, { label: string; icon: string }> = {
  reaction:       { label: "Reaction",         icon: "⚡" },
  tictactoe:      { label: "Tic Tac Toe",       icon: "✕" },
  hangman:        { label: "Hangman",           icon: "◉" },
  connectfour:    { label: "Connect Four",      icon: "🔴" },
  wordle:         { label: "Wordle Duel",       icon: "🟩" },
  wouldyourather: { label: "Would You Rather",  icon: "🤔" },
  memoryduel:     { label: "Memory Duel",       icon: "🃏" },
  triviaroyale:   { label: "Trivia Royale",     icon: "🧠" },
  bombdefusal:    { label: "Bomb Defusal",      icon: "💣" },
};

// Order shown in the leaderboard's game filter.
export const GAME_ORDER: GameType[] = [
  "tictactoe", "connectfour", "wordle", "hangman", "memoryduel",
  "triviaroyale", "bombdefusal", "wouldyourather", "reaction",
];

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}
