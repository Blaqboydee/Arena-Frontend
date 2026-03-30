import type { Player } from "../../../types";
import { useTicTacToe } from "../../../hooks/useTicTacToe";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";
import TttResultScreen from "./TttResultScreen";

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

// ── Cell ──────────────────────────────────────────────────────────────────────

function Cell({
  value,
  index,
  winLine,
  isMyTurn,
  onClick,
}: {
  value:    string | null;
  index:    number;
  winLine:  number[] | null;
  isMyTurn: boolean;
  onClick:  () => void;
}) {
  const isWinCell   = winLine?.includes(index) ?? false;
  const isEmpty     = value === null;
  const isClickable = isEmpty && isMyTurn;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`
        aspect-square flex items-center justify-center
        text-4xl sm:text-5xl font-display tracking-wide
        border border-border rounded-sm
        transition-all duration-150 select-none
        ${isWinCell
          ? "bg-amber/10 border-amber/50"
          : isClickable
          ? "bg-surface hover:bg-elevated hover:border-border-bright cursor-pointer"
          : "bg-surface cursor-default"
        }
        ${!value && isMyTurn ? "hover:opacity-60" : ""}
      `}
    >
      {value === "X" && (
        <span className={isWinCell ? "text-amber" : "text-text"}>✕</span>
      )}
      {value === "O" && (
        <span className={isWinCell ? "text-amber" : "text-muted"}>○</span>
      )}
    </button>
  );
}

// ── Timer bar ─────────────────────────────────────────────────────────────────

function TimerBar({ pct, isMyTurn }: { pct: number; isMyTurn: boolean }) {
  const color = pct > 50
    ? "bg-green"
    : pct > 25
    ? "bg-amber"
    : "bg-red";

  return (
    <div className="w-full h-1 bg-border rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-100 ${isMyTurn ? color : "bg-dim"}`}
        style={{ width: `${isMyTurn ? pct : 100}%` }}
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TicTacToe({ roomId, myId, players }: Props) {
  const {
    board,
    mySymbol,
    // scores,
    phase,
    roundResult,
    matchOver,
    timeLeft,
    timerPct,
    isMyTurn,
    me,
    opponent,
    myScore,
    oppScore,
    makeMove,
    endMatch,
  } = useTicTacToe({ roomId, myId, players });

  // ── Pending (waiting for first round) ─────────────────────────────────────
  if (phase === "pending") {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="w-10 h-10 rounded-full border-2 border-border border-t-amber animate-spin" />
        <p className="font-mono text-sm text-muted tracking-widest">
          Starting round…
        </p>
      </div>
    );
  }

  // ── Match over ─────────────────────────────────────────────────────────────
  if (phase === "match_over" && matchOver) {
    return (
      <TttResultScreen
        matchOver={matchOver}
        players={players}
        myId={myId}
      />
    );
  }

  const winLine = roundResult?.winLine ?? null;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">

      {/* ── Scoreboard ── */}
      <div className="w-full bg-surface border border-border rounded-sm px-5 py-4 flex items-center justify-between">
        {/* Me */}
        <div className="flex items-center gap-2">
          <Avatar name={me?.name ?? "You"} color={me?.avatarColor ?? "amber"} size="sm" />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-dim flex items-center gap-1">
              {me?.name ?? "You"}
              <span className="text-[8px] bg-amber/10 text-amber border border-amber/30 rounded px-1 tracking-widest uppercase">
                {mySymbol}
              </span>
            </span>
            <span className="font-display text-4xl text-text leading-none">{myScore}</span>
          </div>
        </div>

        <span className="font-display text-base tracking-[4px] text-dim">VS</span>

        {/* Opponent */}
        <div className="flex items-center gap-2 flex-row-reverse">
          <Avatar name={opponent?.name ?? "?"} color={opponent?.avatarColor ?? "cyan"} size="sm" />
          <div className="flex flex-col items-end">
            <span className="font-mono text-[10px] text-dim flex items-center gap-1">
              <span className="text-[8px] bg-elevated text-muted border border-border rounded px-1 tracking-widest uppercase">
                {mySymbol === "X" ? "O" : "X"}
              </span>
              {opponent?.name ?? "Opponent"}
            </span>
            <span className="font-display text-4xl text-text leading-none">{oppScore}</span>
          </div>
        </div>
      </div>

      {/* ── Timer + turn indicator ── */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={`font-mono text-xs transition-colors duration-200 ${
            isMyTurn ? "text-amber" : "text-muted"
          }`}>
            {phase === "round_over"
              ? roundResult?.winnerId === myId
                ? "✅ You won this round!"
                : roundResult?.winnerId
                ? `❌ ${roundResult.winnerName} won this round`
                : roundResult?.reason === "draw"
                ? "🤝 Draw — next round starting…"
                : "⏱ Time out — next round starting…"
              : isMyTurn
              ? "Your turn"
              : `${opponent?.name ?? "Opponent"}'s turn`
            }
          </span>
          {phase === "playing" && isMyTurn && (
            <span className={`font-mono text-xs tabular-nums ${
              timerPct > 50 ? "text-green" : timerPct > 25 ? "text-amber" : "text-red"
            }`}>
              {(timeLeft / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        <TimerBar pct={timerPct} isMyTurn={isMyTurn} />
      </div>

      {/* ── Board ── */}
      <div className="w-full grid grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <Cell
            key={i}
            value={cell}
            index={i}
            winLine={winLine}
            isMyTurn={isMyTurn && phase === "playing"}
            onClick={() => makeMove(i)}
          />
        ))}
      </div>

      {/* ── End match button ── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={endMatch}
        className="mt-2 text-dim hover:text-red"
      >
        End Match
      </Button>
    </div>
  );
}