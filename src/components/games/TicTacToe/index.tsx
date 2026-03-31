import type { Player } from "../../../types";
import { useTicTacToe } from "../../../hooks/useTicTacToe";
import TttResultScreen from "./TttResultScreen";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

// ── Cell ──────────────────────────────────────────────────────────────────────

function Cell({
  value, index, winLine, isMyTurn, isLocked,
  mySymbol, hoverIndex, onHover, onLeave, onClick,
}: {
  value:       string | null;
  index:       number;
  winLine:     number[] | null;
  isMyTurn:    boolean;
  isLocked:    boolean;
  mySymbol:    string;
  hoverIndex:  number | null;
  onHover:     () => void;
  onLeave:     () => void;
  onClick:     () => void;
}) {
  const isWinCell   = winLine?.includes(index) ?? false;
  const isEmpty     = value === null;
  const isClickable = isEmpty && isMyTurn && !isLocked;
  const isHovered   = hoverIndex === index && isClickable;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      disabled={!isClickable}
      className={`
        aspect-square flex items-center justify-center
        border rounded-sm transition-all duration-150 select-none
        ${isWinCell
          ? "bg-amber/10 border-amber/50"
          : isHovered
          ? "bg-elevated border-border-bright"
          : isClickable
          ? "bg-surface border-border hover:bg-elevated hover:border-border-bright cursor-pointer"
          : "bg-surface border-border cursor-default"
        }
      `}
    >
      {/* Placed symbol */}
      {value === "X" && (
        <span className={`font-display text-4xl sm:text-5xl leading-none transition-colors ${isWinCell ? "text-amber" : "text-text"}`}>
          ✕
        </span>
      )}
      {value === "O" && (
        <span className={`font-display text-4xl sm:text-5xl leading-none transition-colors ${isWinCell ? "text-amber" : "text-muted"}`}>
          ○
        </span>
      )}
      {/* Ghost preview on hover */}
      {!value && isHovered && (
        <span className="font-display text-4xl sm:text-5xl leading-none text-amber/30">
          {mySymbol === "X" ? "✕" : "○"}
        </span>
      )}
    </button>
  );
}

// ── Timer bar ─────────────────────────────────────────────────────────────────

function TimerBar({ pct }: { pct: number }) {
  const color = pct > 50 ? "bg-green" : pct > 25 ? "bg-amber" : "bg-red";
  return (
    <div className="w-full h-1 bg-border rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-[width] duration-100 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Confirm End Modal ─────────────────────────────────────────────────────────

function ConfirmEndModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bg/80 backdrop-blur-sm">
      <div className="bracket-card bg-surface border border-border rounded-sm p-8 w-full max-w-xs flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-2xl tracking-wide text-text">End Match?</h3>
          <p className="font-mono text-xs text-muted">
            Current scores will be tallied and the match will be over for both players.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" fullWidth onClick={onCancel}>Cancel</Button>
          <Button variant="danger" size="sm" fullWidth onClick={onConfirm}>End Match</Button>
        </div>
      </div>
    </div>
  );
}

// ── Round announcement banner ─────────────────────────────────────────────────

function RoundBanner({ roundNumber }: { roundNumber: number }) {
  return (
    <div className="w-full flex items-center justify-center py-1 slide-up-1">
      <span className="font-mono text-[10px] text-dim tracking-[4px] uppercase">
        Round {roundNumber}
      </span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TicTacToe({ roomId, myId, players }: Props) {
  const {
    board, mySymbol, roundNumber,
    phase, roundResult, matchOver,
    timeLeft, timerPct, isMyTurn,
    me, opponent, myScore, oppScore,
    showConfirmEnd, hoverIndex, setHoverIndex,
    makeMove, requestEndMatch, confirmEndMatch, cancelEndMatch,
  } = useTicTacToe({ roomId, myId, players });

  // ── Pending ────────────────────────────────────────────────────────────────
  if (phase === "pending") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-border border-t-amber animate-spin" />
        <p className="font-mono text-sm text-muted tracking-widest">Starting…</p>
      </div>
    );
  }

  // ── Match over ─────────────────────────────────────────────────────────────
  if (phase === "match_over" && matchOver) {
    return <TttResultScreen matchOver={matchOver} players={players} myId={myId} />;
  }

  const winLine  = roundResult?.winLine ?? null;
  const isLocked = phase === "round_over";

  // Turn / round-over status text
  const statusText = phase === "round_over"
    ? roundResult?.winnerId === myId
      ? "✅ You won this round!"
      : roundResult?.winnerId
      ? `❌ ${roundResult.winnerName} won this round`
      : roundResult?.reason === "draw"
      ? "🤝 Draw!"
      : "⏱ Time's up!"
    : isMyTurn
    ? "Your turn"
    : `${opponent?.name ?? "Opponent"}'s turn…`;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">

      {/* ── Scoreboard ── */}
      <div className="w-full bg-surface border border-border rounded-sm px-5 py-4 flex items-center justify-between">
        {/* Me */}
        <div className="flex items-center gap-2.5">
          <Avatar name={me?.name ?? "You"} color={me?.avatarColor ?? "amber"} size="sm" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-muted">{me?.name ?? "You"}</span>
              <span className="font-mono text-[8px] bg-amber/10 text-amber border border-amber/30 rounded px-1 tracking-widest uppercase">
                {mySymbol}
              </span>
              {isMyTurn && phase === "playing" && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse shrink-0" />
              )}
            </div>
            <span className="font-display text-4xl text-text leading-none">{myScore}</span>
          </div>
        </div>

        {/* Round counter */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-display text-base tracking-[4px] text-dim">VS</span>
          {roundNumber > 0 && (
            <span className="font-mono text-[9px] text-dim tracking-widest">R{roundNumber}</span>
          )}
        </div>

        {/* Opponent */}
        <div className="flex items-center gap-2.5 flex-row-reverse">
          <Avatar name={opponent?.name ?? "?"} color={opponent?.avatarColor ?? "cyan"} size="sm" />
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              {!isMyTurn && phase === "playing" && (
                <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse shrink-0" />
              )}
              <span className="font-mono text-[8px] bg-elevated text-muted border border-border rounded px-1 tracking-widest uppercase">
                {mySymbol === "X" ? "O" : "X"}
              </span>
              <span className="font-mono text-[10px] text-muted">{opponent?.name ?? "Opponent"}</span>
            </div>
            <span className="font-display text-4xl text-text leading-none">{oppScore}</span>
          </div>
        </div>
      </div>

      {/* ── Timer ── */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className={`font-mono text-xs transition-colors duration-200 ${
            phase === "round_over"
              ? roundResult?.winnerId === myId ? "text-green" : roundResult?.winnerId ? "text-red" : "text-muted"
              : isMyTurn ? "text-amber" : "text-muted"
          }`}>
            {statusText}
          </span>
          {phase === "playing" && (
            <span className={`font-mono text-xs tabular-nums ${
              timerPct > 50 ? "text-green" : timerPct > 25 ? "text-amber" : "text-red"
            }`}>
              {(timeLeft / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        <TimerBar pct={phase === "playing" ? timerPct : 0} />
      </div>

      {/* ── Round banner ── */}
      {roundNumber > 0 && <RoundBanner roundNumber={roundNumber} />}

      {/* ── Board ── */}
      <div className="w-full grid grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <Cell
            key={i}
            value={cell}
            index={i}
            winLine={winLine}
            isMyTurn={isMyTurn}
            isLocked={isLocked}
            mySymbol={mySymbol}
            hoverIndex={hoverIndex}
            onHover={() => setHoverIndex(i)}
            onLeave={() => setHoverIndex(null)}
            onClick={() => makeMove(i)}
          />
        ))}
      </div>

      {/* ── End match ── */}
      <button
        onClick={requestEndMatch}
        className="font-mono text-[11px] text-dim hover:text-red tracking-widest uppercase transition-colors duration-150 mt-1"
      >
        End Match
      </button>

      {/* ── Confirm modal ── */}
      {showConfirmEnd && (
        <ConfirmEndModal onConfirm={confirmEndMatch} onCancel={cancelEndMatch} />
      )}
    </div>
  );
}