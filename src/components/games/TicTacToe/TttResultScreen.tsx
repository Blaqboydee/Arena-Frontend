import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Player } from "../../../types";
import type { TttMatchOver } from "../../../hooks/useTicTacToe";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";

type Props = {
  matchOver: TttMatchOver;
  players:   Player[];
  myId:      string;
};

export default function TttResultScreen({ matchOver, players, myId }: Props) {
  const navigate    = useNavigate();
  const [copied, setCopied] = useState(false);

  const iWon      = matchOver.winnerId === myId;
  const isDraw    = matchOver.winnerId === null;
  const me        = players.find((p) => p.id === myId);
  const opponent  = players.find((p) => p.id !== myId);
  const myScore   = matchOver.scores[myId] ?? 0;
  const oppScore  = opponent ? (matchOver.scores[opponent.id] ?? 0) : 0;

  function shareResult() {
    const text = isDraw
      ? `Drew ${myScore}-${oppScore} after ${matchOver.totalRounds} rounds on ARENA ⚡ arena.gg`
      : iWon
      ? `Beat ${opponent?.name ?? "my opponent"} ${myScore}-${oppScore} in Tic Tac Toe on ARENA ⚡ arena.gg`
      : `Lost to ${matchOver.winnerName} ${oppScore}-${myScore} in Tic Tac Toe on ARENA ⚡ arena.gg`;

    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md slide-up-1">

      {/* Headline */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-6xl leading-none">
          {isDraw ? "🤝" : iWon ? "🏆" : "💀"}
        </span>
        <h2 className={`font-display text-6xl tracking-arena ${
          isDraw ? "text-muted" : iWon ? "text-amber" : "text-muted"
        }`}>
          {isDraw ? "DRAW" : iWon ? "YOU WIN" : "YOU LOSE"}
        </h2>
        <p className="font-mono text-xs text-dim">
          {matchOver.totalRounds} round{matchOver.totalRounds !== 1 ? "s" : ""} played
        </p>
      </div>

      {/* Score card */}
      <div className="bracket-card w-full bg-surface border border-border rounded-sm p-6 flex flex-col gap-5">

        {/* Players + scores */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-2">
            <Avatar name={me?.name ?? "You"} color={me?.avatarColor ?? "amber"} size="lg" />
            <span className="font-mono text-xs text-muted">
              {me?.name ?? "You"}
              <span className="ml-1.5 text-[9px] bg-amber/10 text-amber border border-amber/30 rounded px-1 py-0.5 tracking-widest uppercase">
                you
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`font-display text-7xl leading-none ${iWon ? "text-amber" : "text-text"}`}>
              {myScore}
            </span>
            <span className="font-display text-2xl text-dim tracking-widest">—</span>
            <span className={`font-display text-7xl leading-none ${!iWon && !isDraw ? "text-amber" : "text-text"}`}>
              {oppScore}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Avatar name={opponent?.name ?? "?"} color={opponent?.avatarColor ?? "cyan"} size="lg" />
            <span className="font-mono text-xs text-muted">
              {opponent?.name ?? "Opponent"}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="rule-label"><span>match complete</span></div>

        <p className="text-center font-mono text-xs text-muted">
          {isDraw
            ? "Perfectly matched. Run it back."
            : iWon
            ? "Dominant. Send the link to a new challenger."
            : `${matchOver.winnerName} takes this one. Rematch?`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full">
        <Button variant="primary" size="lg" fullWidth onClick={shareResult} className="amber-pulse">
          {copied ? "Copied!" : "Share Result ↗"}
        </Button>
        <div className="flex gap-3">
          <Button variant="secondary" size="md" fullWidth onClick={() => navigate("/lobby")}>
            Back to Lobby
          </Button>
          <Button variant="ghost" size="md" fullWidth onClick={() => navigate("/")}>
            Change Name
          </Button>
        </div>
      </div>
    </div>
  );
}