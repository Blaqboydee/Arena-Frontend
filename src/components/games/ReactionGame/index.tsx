import type { Player } from "../../../types";
import { useReactionGame } from "../../../hooks/useReactionGame";
import ResultScreen from "./ResultScreen";
import Avatar from "../../ui/Avatar";

type Props = {
  roomId: string;
  myId: string;
  players: Player[];
};

export default function ReactionGame({ roomId, myId, players }: Props) {
  const {
    phase,
    statusMsg,
    canClick,
    flashGreen,
    scores,
    result,
    roundResult,
    me,
    opponent,
    myScore,
    opponentScore,
    sendClick,
    getPlayerName,
  } = useReactionGame({ roomId, myId, players });

  // ── Match over ─────────────────────────────────────────────────────────────
  if (phase === "match_over" && result) {
    return (
      <ResultScreen
        result={result}
        players={players}
        myId={myId}
        scores={scores}
      />
    );
  }

  // ── Active game ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg">

      {/* ── Scoreboard ── */}
      <div className="w-full bg-surface border border-border rounded-sm px-6 py-4 flex items-center justify-between">
        {/* My side */}
        <div className="flex items-center gap-3">
          <Avatar
            name={me?.name ?? "You"}
            color={me?.avatarColor ?? "amber"}
            size="md"
          />
          <div className="flex flex-col">
            <span className="font-mono text-xs text-muted flex items-center gap-1.5">
              {me?.name ?? "You"}
              <span className="text-[9px] bg-amber/10 text-amber border border-amber/30 rounded px-1 tracking-widest uppercase">
                you
              </span>
            </span>
            <span className="font-display text-5xl text-text leading-none">
              {myScore}
            </span>
          </div>
        </div>

        {/* VS */}
        <span className="font-display text-lg tracking-[5px] text-dim">VS</span>

        {/* Opponent side */}
        <div className="flex items-center gap-3 flex-row-reverse">
          <Avatar
            name={opponent?.name ?? "?"}
            color={opponent?.avatarColor ?? "cyan"}
            size="md"
          />
          <div className="flex flex-col items-end">
            <span className="font-mono text-xs text-muted">
              {opponent?.name ?? "Opponent"}
            </span>
            <span className="font-display text-5xl text-text leading-none">
              {opponentScore}
            </span>
          </div>
        </div>
      </div>

      {/* ── Status message ── */}
      <p className={`
        font-mono text-sm text-center min-h-5 transition-colors duration-200
        ${flashGreen ? "text-green font-medium" : "text-muted"}
      `}>
        {statusMsg}
      </p>

      {/* ── Click button ── */}
      <button
        onClick={sendClick}
        disabled={!canClick}
        className={`
          w-48 h-48 rounded-full font-display text-3xl tracking-widest
          border-2 transition-all duration-150 select-none
          ${canClick
            ? "bg-green text-bg border-green cursor-pointer hover:scale-105 active:scale-95 amber-pulse"
            : "bg-surface text-muted border-border cursor-not-allowed"
          }
        `}
        style={canClick ? {
          boxShadow: "0 0 48px rgba(61,255,160,0.4)",
          animation: "pulse-green 0.6s ease infinite alternate",
        } : {}}
      >
        {canClick ? "CLICK!" : "WAIT"}
      </button>

      {/* ── Round result banner ── */}
      {roundResult && (
        <div className="w-full bg-surface border border-border rounded-sm px-5 py-3 text-center slide-up-1">
          <span className="font-mono text-sm text-text">
            {roundResult.winner === myId
              ? "✅ You won that round!"
              : `❌ ${getPlayerName(roundResult.winner)} won that round`}
          </span>
          {roundResult.reason && (
            <span className="font-mono text-xs text-muted ml-2">
              ({roundResult.reason})
            </span>
          )}
        </div>
      )}
    </div>
  );
}