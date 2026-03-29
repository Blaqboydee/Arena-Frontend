// ── Player ────────────────────────────────────────────────────────────────────

export type AvatarColor =
  | "amber" | "cyan" | "rose" | "violet" | "emerald" | "sky";

export type Player = {
  id: string;
  name: string;
  avatarColor: AvatarColor;
};

// ── Room / Lobby ──────────────────────────────────────────────────────────────

export type GameType = "reaction" | "tictactoe" | "hangman";

export type RoomStatus = "waiting" | "in_progress" | "finished";

export type Room = {
  id: string;
  gameType: GameType;
  status: RoomStatus;
  players: Player[];
  inviteCode?: string;
};

export type GameQueueCounts = Record<GameType, number>;

// ── Game events (shared envelope) ────────────────────────────────────────────

export type GameUpdate = {
  message: string;
  green?: boolean;
};

export type GameResult = {
  winner: string; // socket id
  final: boolean;
  scores: Record<string, number>;
  reason?: string | null;
};

// ── UI phase (per-game, not platform) ────────────────────────────────────────

export type GamePhase = "waiting" | "in_game" | "match_over";