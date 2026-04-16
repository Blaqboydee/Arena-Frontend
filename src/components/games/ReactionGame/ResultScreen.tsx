import { useNavigate } from "react-router-dom";
import { Trophy, Skull } from "lucide-react";
import type { GameResult, Player } from "../../../types";
import { useShareResult } from "../../../hooks/useShareResult";
import GameShareCard from "../../ui/GameShareCard";
import SharePanel from "../../ui/SharePanel";
import Button from "../../ui/Button";
import Avatar from "../../ui/Avatar";

type Props = {
  result: GameResult;
  players: Player[];
  myId: string;
  scores: Record<string, number>;
};

export default function ResultScreen({ result, players, myId, scores }: Props) {
  const navigate   = useNavigate();

  const iWon       = result.winner === myId;
  const me         = players.find((p) => p.id === myId);
  const opponent   = players.find((p) => p.id !== myId);
  const winnerName = players.find((p) => p.id === result.winner)?.name ?? "Opponent";
  const myScore    = scores[myId] ?? 0;
  const oppScore   = opponent ? (scores[opponent.id] ?? 0) : 0;

  const shareText = iWon
    ? `Beat ${opponent?.name ?? "my opponent"} ${myScore}-${oppScore} in Reaction on ARENA ⚡ arenagameplay.vercel.app`
    : `Lost to ${winnerName} ${oppScore}-${myScore} in Reaction on ARENA ⚡ arenagameplay.vercel.app`;

  const {
    cardRef, sharing, copyDone, downloadDone,
    shareNative, shareTwitter, shareWhatsApp, copyImage, downloadImage,
  } = useShareResult({ shareText });

  const tagline = iWon ? "Pure reflex wins." : `${winnerName} reacted faster.`;

  const ResultIcon = iWon
    ? <Trophy size={56} strokeWidth={1.25} className="text-amber" />
    : <Skull  size={56} strokeWidth={1.25} className="text-muted" />;

  return (
    <>
      <GameShareCard
        gameLabel="REACTION"
        winnerId={result.winner ?? null}
        myId={myId}
        players={players}
        myScore={myScore}
        oppScore={oppScore}
        totalRounds={myScore + oppScore}
        tagline={tagline}
        cardRef={cardRef}
      />

      <div className="flex flex-col items-center gap-8 w-full max-w-md slide-up-1">

        {/* Result headline */}
        <div className="flex flex-col items-center gap-2">
          {ResultIcon}
          <h2 className={`font-display text-6xl tracking-arena ${iWon ? "text-amber" : "text-muted"}`}>
            {iWon ? "YOU WIN" : "YOU LOSE"}
          </h2>
          {result.reason && (
            <p className="font-mono text-xs text-dim">{result.reason}</p>
          )}
        </div>

        {/* Score card */}
        <div className="bracket-card w-full bg-surface border border-border rounded-sm p-6 flex flex-col gap-4">

          {/* Players row */}
          <div className="flex items-center justify-between">
            {/* Me */}
            <div className="flex flex-col items-center gap-2">
              <Avatar
                name={me?.name ?? "You"}
                color={me?.avatarColor ?? "amber"}
                size="lg"
              />
              <span className="font-mono text-xs text-muted">
                {me?.name ?? "You"}
                <span className="ml-1.5 text-[9px] bg-amber/10 text-amber border border-amber/30 rounded px-1 py-0.5 tracking-widest uppercase">
                  you
                </span>
              </span>
            </div>

            {/* Scores */}
            <div className="flex items-center gap-3">
              <span className={`font-display text-7xl leading-none ${iWon ? "text-amber" : "text-text"}`}>
                {myScore}
              </span>
              <span className="font-display text-2xl text-dim tracking-widest">—</span>
              <span className={`font-display text-7xl leading-none ${!iWon ? "text-amber" : "text-text"}`}>
                {oppScore}
              </span>
            </div>

            {/* Opponent */}
            <div className="flex flex-col items-center gap-2">
              <Avatar
                name={opponent?.name ?? "?"}
                color={opponent?.avatarColor ?? "cyan"}
                size="lg"
              />
              <span className="font-mono text-xs text-muted">
                {opponent?.name ?? "Opponent"}
              </span>
            </div>
          </div>

          <div className="rule-label"><span>match complete</span></div>

          <p className="text-center font-mono text-xs text-muted">
            {iWon
              ? "You dominated. Send the link to a new challenger."
              : `${winnerName} takes this one. You know what to do.`}
          </p>
        </div>

        {/* Share panel */}
        <SharePanel
          sharing={sharing} copyDone={copyDone} downloadDone={downloadDone}
          shareNative={shareNative} shareTwitter={shareTwitter}
          shareWhatsApp={shareWhatsApp} copyImage={copyImage} downloadImage={downloadImage}
        />

        {/* Navigation */}
        <div className="flex gap-3 w-full">
          <Button variant="secondary" size="md" fullWidth onClick={() => navigate("/lobby")}>
            Back to Lobby
          </Button>
          <Button variant="ghost" size="md" fullWidth onClick={() => navigate("/")}>
            Change Name
          </Button>
        </div>
      </div>
    </>
  );
}