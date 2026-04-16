import type { Player } from "../../../types";
import { useMemoryDuel } from "../../../hooks/useMemoryDuel";
import MemResultScreen from "./MemResultScreen";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

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

// ── Card ──────────────────────────────────────────────────────────────────────

function MemoryCard({
  emoji, flipped, matched, isMyTurn, onClick,
}: {
  emoji:    string | null;
  flipped:  boolean;
  matched:  boolean;
  isMyTurn: boolean;
  onClick:  () => void;
}) {
  const isClickable = !flipped && !matched && isMyTurn;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`
        aspect-square flex items-center justify-center
        border rounded-sm transition-all duration-200 select-none text-2xl sm:text-3xl
        ${matched
          ? "bg-amber/10 border-amber/40 opacity-60"
          : flipped
          ? "bg-elevated border-border-bright"
          : isClickable
          ? "bg-surface border-border hover:bg-elevated hover:border-border-bright cursor-pointer hover:scale-105 active:scale-95"
          : "bg-surface border-border cursor-default"
        }
      `}
    >
      {(flipped || matched) ? emoji : (
        <span className="text-dim text-lg">?</span>
      )}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MemoryDuel({ roomId, myId, players }: Props) {
  const {
    board, roundNumber, phase, roundResult, matchOver,
    timeLeft, timerPct, isMyTurn,
    me, opponent, myScore, oppScore, myPairs, oppPairs,
    showConfirmEnd,
    flipCard, requestEndMatch, confirmEndMatch, cancelEndMatch,
  } = useMemoryDuel({ roomId, myId, players });

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
    return <MemResultScreen matchOver={matchOver} players={players} myId={myId} />;
  }

  const isLocked   = phase === "round_over";

  const statusText = phase === "round_over"
    ? roundResult?.winnerId === myId
      ? "✅ You won this round!"
      : roundResult?.winnerId
      ? `❌ ${roundResult.winnerName} won this round`
      : "🤝 Draw!"
    : isMyTurn
    ? "Your turn — flip a card"
    : `${opponent?.name ?? "Opponent"}'s turn…`;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">

      {/* ── Scoreboard ── */}
      <div className="w-full bg-surface border border-border rounded-sm px-5 py-4 flex items-center justify-between">
        {/* Me */}
        <div className="flex items-center gap-2.5">
          <Avatar name={me?.name ?? "You"} color={me?.avatarColor ?? "amber"} size="sm" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-muted">{me?.name ?? "You"}</span>
              {isMyTurn && phase === "playing" && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse shrink-0" />
              )}
            </div>
            <span className="font-display text-3xl text-text leading-none">{myScore}</span>
            <span className="font-mono text-[9px] text-dim">{myPairs} pairs</span>
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
              <span className="font-mono text-[10px] text-muted">{opponent?.name ?? "Opponent"}</span>
            </div>
            <span className="font-display text-3xl text-text leading-none">{oppScore}</span>
            <span className="font-mono text-[9px] text-dim">{oppPairs} pairs</span>
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

      {/* ── Board 4×4 ── */}
      <div className="w-full grid grid-cols-4 gap-2">
        {board.map((card) => (
          <MemoryCard
            key={card.id}
            emoji={card.emoji}
            flipped={card.flipped}
            matched={card.matched}
            isMyTurn={isMyTurn && !isLocked}
            onClick={() => flipCard(card.id)}
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

      {showConfirmEnd && (
        <ConfirmEndModal onConfirm={confirmEndMatch} onCancel={cancelEndMatch} />
      )}
    </div>
  );
}
