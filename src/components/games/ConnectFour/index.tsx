import type { Player } from "../../../types";
import { useConnectFour } from "../../../hooks/useConnectFour";
import C4ResultScreen from "./C4ResultScreen";
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

// ── Disc colors ───────────────────────────────────────────────────────────────

const DISC_STYLES: Record<string, string> = {
  red:    "bg-red",
  yellow: "bg-amber",
};

const DISC_WIN_STYLES: Record<string, string> = {
  red:    "bg-red ring-2 ring-red/50",
  yellow: "bg-amber ring-2 ring-amber/50",
};

// ── Board cell ────────────────────────────────────────────────────────────────

function BoardCell({
  value, row, col, isWinCell, hoverCol, isMyTurn, isLocked, myColor,
  onHover, onLeave, onClick,
}: {
  value:     string | null;
  row:       number;
  col:       number;
  isWinCell: boolean;
  hoverCol:  number | null;
  isMyTurn:  boolean;
  isLocked:  boolean;
  myColor:   string;
  onHover:   () => void;
  onLeave:   () => void;
  onClick:   () => void;
}) {
  const isHoveredCol = hoverCol === col && isMyTurn && !isLocked;
  const isClickable  = !isLocked && isMyTurn && value === null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      disabled={!isClickable && value !== null}
      className={`
        aspect-square flex items-center justify-center
        rounded-full transition-all duration-150
        ${isHoveredCol && !value
          ? "bg-elevated"
          : "bg-surface"
        }
        border
        ${isWinCell
          ? "border-amber"
          : isHoveredCol && !value
          ? "border-border-bright"
          : "border-border"
        }
        ${isClickable ? "cursor-pointer" : "cursor-default"}
      `}
    >
      {value && (
        <div className={`w-[70%] h-[70%] rounded-full transition-all duration-200 ${
          isWinCell ? (DISC_WIN_STYLES[value] ?? "bg-muted") : (DISC_STYLES[value] ?? "bg-muted")
        }`} />
      )}
      {/* Ghost preview for topmost empty in hovered column */}
      {!value && isHoveredCol && row === 0 && (
        <div className={`w-[70%] h-[70%] rounded-full opacity-30 ${DISC_STYLES[myColor] ?? "bg-muted"}`} />
      )}
    </button>
  );
}

// ── Column drop indicator ─────────────────────────────────────────────────────

function DropIndicators({
  hoverCol, isMyTurn, isLocked, myColor,
}: {
  hoverCol:  number | null;
  isMyTurn:  boolean;
  isLocked:  boolean;
  myColor:   string;
}) {
  return (
    <div className="grid grid-cols-7 gap-1 mb-1">
      {Array.from({ length: 7 }).map((_, col) => (
        <div key={col} className="flex items-center justify-center h-4">
          {hoverCol === col && isMyTurn && !isLocked && (
            <div className={`w-3 h-3 rounded-full animate-bounce ${DISC_STYLES[myColor] ?? "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ConnectFour({ roomId, myId, players }: Props) {
  const {
    board, myColor, oppColor, roundNumber,
    phase, roundResult, matchOver,
    timeLeft, timerPct, isMyTurn,
    me, opponent, myScore, oppScore,
    showConfirmEnd, hoverCol, setHoverCol,
    dropDisc, requestEndMatch, confirmEndMatch, cancelEndMatch,
  } = useConnectFour({ roomId, myId, players });

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
    return <C4ResultScreen matchOver={matchOver} players={players} myId={myId} />;
  }

  const winCellSet = new Set(
    (roundResult?.winCells ?? []).map(([r, c]) => `${r},${c}`)
  );
  const isLocked = phase === "round_over";

  // Status text
  const statusText = phase === "round_over"
    ? roundResult?.winnerId === myId
      ? "✅ You won this round!"
      : roundResult?.winnerId
      ? `❌ ${roundResult.winnerName} won this round`
      : "🤝 Draw!"
    : isMyTurn
    ? "Your turn"
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
              <span className={`w-3 h-3 rounded-full ${DISC_STYLES[myColor]}`} />
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
              <span className={`w-3 h-3 rounded-full ${DISC_STYLES[oppColor]}`} />
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
      {roundNumber > 0 && (
        <div className="w-full flex items-center justify-center py-1 slide-up-1">
          <span className="font-mono text-[10px] text-dim tracking-[4px] uppercase">
            Round {roundNumber}
          </span>
        </div>
      )}

      {/* ── Drop indicators ── */}
      <DropIndicators
        hoverCol={hoverCol}
        isMyTurn={isMyTurn}
        isLocked={isLocked}
        myColor={myColor}
      />

      {/* ── Board ── */}
      <div className="w-full bg-elevated border border-border rounded-sm p-2">
        <div className="grid grid-cols-7 gap-1">
          {board.map((row, r) =>
            row.map((cell, c) => (
              <BoardCell
                key={`${r}-${c}`}
                value={cell}
                row={r}
                col={c}
                isWinCell={winCellSet.has(`${r},${c}`)}
                hoverCol={hoverCol}
                isMyTurn={isMyTurn}
                isLocked={isLocked}
                myColor={myColor}
                onHover={() => setHoverCol(c)}
                onLeave={() => setHoverCol(null)}
                onClick={() => dropDisc(c)}
              />
            ))
          )}
        </div>
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
