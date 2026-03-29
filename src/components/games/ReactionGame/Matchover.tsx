import type { GameResult, Player } from "../../../types";

type Props = {
  myId: string;
  players: Player[];
  result: GameResult;
  scores: Record<string, number>;
  onPlayAgain: () => void;
};

export default function MatchOver({ myId, players, result, scores, onPlayAgain }: Props) {
  const iWon = result.winner === myId;
  const winnerName =
    players.find((p) => p.id === result.winner)?.name ?? "Opponent";

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      {/* Trophy */}
      <span className="text-7xl leading-none">{iWon ? "🏆" : "💀"}</span>

      <h2 className="font-display text-5xl tracking-[4px] text-accent">
        {iWon ? "YOU WIN!" : `${winnerName} WINS`}
      </h2>

      {result.reason && (
        <p className="text-xs text-muted tracking-wide">{result.reason}</p>
      )}

      {/* Final Scores */}
      <div className="w-full flex flex-col gap-2 my-2">
        {players.map((p) => {
          const isWinner = p.id === result.winner;
          return (
            <div
              key={p.id}
              className={`
                flex justify-between items-center px-4 py-3 rounded-xl
                border transition-colors
                ${isWinner
                  ? "border-accent bg-surface text-text"
                  : "border-border bg-bg text-muted"
                }
              `}
            >
              <span className="text-sm">
                {p.name}
                {p.id === myId && (
                  <span className="ml-2 text-xs text-muted">(you)</span>
                )}
              </span>
              <span className="font-display text-3xl text-text">
                {scores[p.id] ?? 0}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={onPlayAgain}
        className="
          w-full bg-accent text-bg font-display text-xl tracking-widest
          py-3 rounded-xl
          hover:bg-accent-dim active:scale-95
          transition-all duration-150
        "
      >
        PLAY AGAIN
      </button>
    </div>
  );
}