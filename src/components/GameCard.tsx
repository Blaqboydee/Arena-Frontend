import Badge from "./ui/Badge";
import Button from "./ui/Button";
import type { GameType } from "../types";

type GameMeta = {
  gameType: GameType;
  label: string;
  description: string;
  icon: string;
  available: boolean;
};

type Props = {
  game: GameMeta;
  queueCount: number;
  isQueuing: boolean;       // this card's game is being queued
  anyQueuing: boolean;      // any game is being queued (disables others)
  onQuickMatch: () => void;
  onPrivateRoom: () => void;
  onCancel: () => void;
};

export const GAMES: GameMeta[] = [
  {
    gameType:    "reaction",
    label:       "Reaction",
    description: "First to click when the light goes green. Pure reflex.",
    icon:        "⚡",
    available:   true,
  },
  {
    gameType:    "tictactoe",
    label:       "Tic Tac Toe",
    description: "Classic 3×3. Outsmart your opponent in seconds.",
    icon:        "✕",
    available:   false,
  },
  {
    gameType:    "hangman",
    label:       "Hangman",
    description: "Guess the word before the clock runs out.",
    icon:        "◉",
    available:   false,
  },
];

export default function GameCard({
  game,
  queueCount,
  isQueuing,
  anyQueuing,
  onQuickMatch,
  onPrivateRoom,
  onCancel,
}: Props) {
  const disabled = !game.available || (anyQueuing && !isQueuing);

  return (
    <div
      className={`
        bracket-card relative bg-surface border rounded-sm p-6
        flex flex-col gap-4
        transition-all duration-200
        ${isQueuing
          ? "border-amber shadow-[0_0_24px_rgba(245,166,35,0.12)]"
          : "border-border hover:border-border-bright"
        }
        ${disabled ? "opacity-40" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl tracking-wide text-text">
              {game.label}
            </span>
            {game.available ? (
              <Badge variant="green" dot>Live</Badge>
            ) : (
              <Badge variant="dim">Soon</Badge>
            )}
          </div>
          <p className="font-mono text-xs text-muted leading-relaxed">
            {game.description}
          </p>
        </div>
        <span className="text-3xl leading-none opacity-60 ml-4">{game.icon}</span>
      </div>

      {/* Queue count */}
      <div className="flex items-center gap-2">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            queueCount > 0 ? "bg-green" : "bg-dim"
          }`}
        />
        <span className="font-mono text-[11px] text-muted">
          {queueCount === 0
            ? "No one in queue"
            : queueCount === 1
            ? "1 player waiting"
            : `${queueCount} players waiting`}
        </span>
      </div>

      {/* Actions */}
      {game.available && (
        <div className="flex flex-col gap-2 mt-auto">
          {isQueuing ? (
            <>
              {/* Queuing state */}
              <div className="flex items-center gap-3 py-2">
                <div className="w-4 h-4 rounded-full border-2 border-border border-t-amber animate-spin shrink-0" />
                <span className="font-mono text-xs text-amber">
                  Finding opponent…
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={onCancel}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                disabled={disabled}
                onClick={onQuickMatch}
              >
                Quick Match
              </Button>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                disabled={disabled}
                onClick={onPrivateRoom}
              >
                Private Room
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}