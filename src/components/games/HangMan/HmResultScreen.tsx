import { useNavigate } from "react-router-dom";
import { Trophy, Skull, Handshake } from "lucide-react";
import type { Player } from "../../../types";
import type { HmMatchOver } from "../../../hooks/useHangman";
import { useShareResult } from "../../../hooks/useShareResult";
import GameShareCard from "../../ui/GameShareCard";
import SharePanel from "../../ui/SharePanel";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";

type Props = {
  matchOver: HmMatchOver;
  players:   Player[];
  myId:      string;
};

export default function HmResultScreen({ matchOver, players, myId }: Props) {
  const navigate = useNavigate();

  const iWon     = matchOver.winnerId === myId;
  const isDraw   = matchOver.winnerId === null;
  const me       = players.find((p) => p.id === myId);
  const opponent = players.find((p) => p.id !== myId);
  const myScore  = matchOver.scores[myId] ?? 0;
  const oppScore = opponent ? (matchOver.scores[opponent.id] ?? 0) : 0;

  const shareText = isDraw
    ? `Drew ${myScore}-${oppScore} after ${matchOver.totalRounds} rounds in Hangman on ARENA ⚡ arenagameplay.vercel.app`
    : iWon
    ? `Beat ${opponent?.name ?? "my opponent"} ${myScore}-${oppScore} in Hangman on ARENA ⚡ arenagameplay.vercel.app`
    : `Lost to ${matchOver.winnerName} ${oppScore}-${myScore} in Hangman on ARENA ⚡ arenagameplay.vercel.app`;

  const {
    cardRef, sharing, copyDone, downloadDone,
    shareNative, shareTwitter, shareWhatsApp, copyImage, downloadImage,
  } = useShareResult({ shareText });

  const tagline = isDraw
    ? "Perfectly matched."
    : iWon
    ? "Word wizard wins."
    : `${matchOver.winnerName} guessed better.`;

  const ResultIcon = isDraw
    ? <Handshake size={56} strokeWidth={1.25} className="text-muted" />
    : iWon
    ? <Trophy    size={56} strokeWidth={1.25} className="text-amber"  />
    : <Skull     size={56} strokeWidth={1.25} className="text-muted"  />;

  return (
    <>
      <GameShareCard
        gameLabel="HANGMAN"
        winnerId={matchOver.winnerId}
        myId={myId}
        players={players}
        myScore={myScore}
        oppScore={oppScore}
        totalRounds={matchOver.totalRounds}
        tagline={tagline}
        cardRef={cardRef}
      />

      <div className="flex flex-col items-center gap-8 w-full max-w-md slide-up-1">

      {/* Headline */}
      <div className="flex flex-col items-center gap-2">
        {ResultIcon}
        <h2 className={`font-display text-6xl tracking-arena ${
          isDraw ? "text-muted" : iWon ? "text-amber" : "text-muted"
        }`}>
          {isDraw ? "DRAW" : iWon ? "YOU WIN" : "YOU LOSE"}
        </h2>
        <p className="font-mono text-xs text-dim">
          {matchOver.totalRounds} round{matchOver.totalRounds !== 1 ? "s" : ""} played
          {matchOver.reason === "forfeit" && " · opponent disconnected"}
        </p>
      </div>

      {/* Score card */}
      <div className="bracket-card w-full bg-surface border border-border rounded-sm p-6 flex flex-col gap-5">
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

        <div className="rule-label"><span>match complete</span></div>

        <p className="text-center font-mono text-xs text-muted">
          {isDraw
            ? "Perfectly matched. Run it back."
            : iWon
            ? "Word wizard. Send the link to a new challenger."
            : `${matchOver.winnerName} takes this one. Rematch?`}
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
