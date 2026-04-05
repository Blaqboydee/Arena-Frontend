import { useState } from "react";
import { createPortal } from "react-dom";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import type { GameType } from "../types";

type GameMeta = {
  gameType: GameType;
  label: string;
  description: string;
  icon: string;
  available: boolean;
  howToPlay: string[];
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
    howToPlay: [
      "A coloured circle appears on screen.",
      "Wait for it to turn GREEN — then tap as fast as you can!",
      "The player with the faster reaction time wins the round.",
      "Best of multiple rounds decides the match.",
    ],
  },
  {
    gameType:    "tictactoe",
    label:       "Tic Tac Toe",
    description: "Classic 3×3. Outsmart your opponent in seconds.",
    icon:        "✕",
    available:   true,
    howToPlay: [
      "You and your opponent take turns placing X or O on a 3×3 grid.",
      "Get three in a row — horizontally, vertically, or diagonally — to win.",
      "Each turn is timed, so think fast!",
      "Rounds repeat with alternating first moves. Most wins takes the match.",
    ],
  },
  {
    gameType:    "hangman",
    label:       "Hangman",
    description: "Set a word, guess a word. Don't get hanged.",
    icon:        "◉",
    available:   true,
    howToPlay: [
      "One player is the Setter — they choose a secret word.",
      "The other player is the Guesser — they pick letters to reveal the word.",
      "Each wrong guess hangs a body part (hat → head → body → arms → legs).",
      "When only one limb remains, the Setter must give a hint.",
      "If the Guesser completes the word, they win. Otherwise the Setter wins.",
      "Roles swap every round!",
    ],
  },
  {
    gameType:    "connectfour",
    label:       "Connect Four",
    description: "Drop discs, connect four in a row. Classic strategy.",
    icon:        "🔴",
    available:   true,
    howToPlay: [
      "Take turns dropping colored discs into a 7-column grid.",
      "Discs fall to the lowest available row in that column.",
      "Connect four of your discs in a row — horizontally, vertically, or diagonally — to win.",
      "Each turn is timed. Think fast!",
      "Rounds repeat with alternating first moves.",
    ],
  },
  {
    gameType:    "wordle",
    label:       "Wordle Duel",
    description: "Race to crack the word. Both guess the same 5-letter word.",
    icon:        "🟩",
    available:   true,
    howToPlay: [
      "Both players guess the same secret 5-letter word simultaneously.",
      "Type a valid 5-letter word and press Enter to submit.",
      "Green = correct letter in the correct spot.",
      "Yellow = correct letter in the wrong spot. Gray = not in the word.",
      "You get 6 attempts. Solve it in fewer guesses to win the round!",
    ],
  },
  {
    gameType:    "wouldyourather",
    label:       "Would You Rather",
    description: "Pick a side. See if you think alike.",
    icon:        "🤔",
    available:   true,
    howToPlay: [
      "A 'Would You Rather' question appears with two options.",
      "Both players choose Option A or Option B simultaneously.",
      "Choices are revealed — see if you agree or disagree!",
      "Track your compatibility percentage as you play.",
      "No winner or loser — just vibes.",
    ],
  },
];

// ── How to Play modal ─────────────────────────────────────────────────────────

function HowToPlayModal({ game, onClose }: { game: GameMeta; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bg/95 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bracket-card bg-bg border border-border rounded-sm p-6 sm:p-8 w-full max-w-sm flex flex-col gap-5 slide-up-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{game.icon}</span>
            <h3 className="font-display text-2xl tracking-wide text-text">
              {game.label}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-dim hover:text-text transition-colors duration-150 p-1"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="rule-label"><span>how to play</span></div>

        {/* Steps */}
        <ol className="flex flex-col gap-3">
          {game.howToPlay.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="font-display text-sm text-amber leading-none mt-0.5 shrink-0">
                {i + 1}
              </span>
              <span className="font-mono text-xs text-muted leading-relaxed">
                {step}
              </span>
            </li>
          ))}
        </ol>

        <Button variant="ghost" size="sm" fullWidth onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>,
    document.body,
  );
}

// ── Game card ─────────────────────────────────────────────────────────────────

export default function GameCard({
  game,
  queueCount,
  isQueuing,
  anyQueuing,
  onQuickMatch,
  onPrivateRoom,
  onCancel,
}: Props) {
  const [showHowTo, setShowHowTo] = useState(false);
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
        <div className="flex flex-col items-end gap-2 ml-4">
          <span className="text-3xl leading-none opacity-60">{game.icon}</span>
          <button
            onClick={() => setShowHowTo(true)}
            className="
              font-mono text-[10px] text-dim hover:text-amber
              tracking-widest uppercase
              transition-colors duration-150
              flex items-center gap-1
            "
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" />
              <text x="8" y="11.5" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="monospace">?</text>
            </svg>
            How to play
          </button>
        </div>
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

      {/* How to play modal */}
      {showHowTo && <HowToPlayModal game={game} onClose={() => setShowHowTo(false)} />}

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