import type { GameResult, Player } from "../../../types";

type Props = {
  myId: string;
  players: Player[];
  statusMsg: string;
  canClick: boolean;
  flashGreen: boolean;
  result: GameResult | null;
  scores: Record<string, number>;
  onClick: () => void;
};

export default function GameScreen({
  myId,
  players,
  statusMsg,
  canClick,
  flashGreen,
  result,
  scores,
  onClick,
}: Props) {
  const me = players.find((p) => p.id === myId);
  const opponent = players.find((p) => p.id !== myId);
  const myScore = scores[myId] ?? 0;
  const opponentScore = opponent ? (scores[opponent.id] ?? 0) : 0;

  const roundWinnerName =
    result && !result.final
      ? result.winner === myId
        ? "You"
        : (opponent?.name ?? "Opponent")
      : null;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg">

      {/* ── Scoreboard ── */}
      <div className="w-full flex items-center justify-between bg-surface border border-border rounded-2xl px-7 py-5">
        {/* My side */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted flex items-center gap-1.5">
            {me?.name ?? "You"}
            <span className="bg-accent text-bg text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded">
              YOU
            </span>
          </span>
          <span className="font-display text-6xl text-text leading-none">
            {myScore}
          </span>
        </div>

        <span className="font-display text-lg tracking-[5px] text-border">
          VS
        </span>

        {/* Opponent side */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-muted">
            {opponent?.name ?? "Opponent"}
          </span>
          <span className="font-display text-6xl text-text leading-none">
            {opponentScore}
          </span>
        </div>
      </div>

      {/* ── Status ── */}
      <p
        className={`text-lg text-center min-h-7 transition-colors duration-200 ${
          flashGreen ? "text-green font-semibold" : "text-muted"
        }`}
      >
        {statusMsg}
      </p>

      {/* ── Click Button ── */}
      <button
        onClick={onClick}
        disabled={!canClick}
        className={`
          w-48 h-48 rounded-full font-display text-3xl tracking-widest
          border-2 transition-all duration-150
          ${
            canClick
              ? "bg-green text-bg border-green shadow-[0_0_48px_rgba(61,255,160,0.45)] animate-pulse-glow cursor-pointer hover:scale-105 active:scale-95"
              : "bg-surface text-muted border-border cursor-not-allowed"
          }
        `}
      >
        {canClick ? "CLICK!" : "WAIT"}
      </button>

      {/* ── Round Result Banner ── */}
      {roundWinnerName && (
        <div className="bg-surface border border-border rounded-xl px-5 py-3 text-sm text-text text-center">
          {roundWinnerName === "You" ? "✅ You won that round!" : `❌ ${roundWinnerName} won that round`}
          {result?.reason && (
            <span className="text-muted ml-1">({result.reason})</span>
          )}
        </div>
      )}
    </div>
  );
}