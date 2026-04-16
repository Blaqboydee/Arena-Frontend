import { useNavigate } from "react-router-dom";
import { Trophy, Crown } from "lucide-react";
import type { TrivMatchOver } from "../../../hooks/useTriviaRoyale";
import { useShareResult } from "../../../hooks/useShareResult";
import SharePanel from "../../ui/SharePanel";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";

type Props = {
  matchOver: TrivMatchOver;
  myId:      string;
};

export default function TrivResultScreen({ matchOver, myId }: Props) {
  const navigate = useNavigate();

  const { leaderboard, totalQuestions } = matchOver;
  const myRank  = leaderboard.findIndex((e) => e.id === myId) + 1;
  const iWon    = matchOver.winnerId === myId;
  const myScore = matchOver.scores[myId] ?? 0;

  const shareText = iWon
    ? `I won Trivia Royale scoring ${myScore} pts across ${totalQuestions} questions on ARENA 🧠 arenagameplay.vercel.app`
    : `I finished #${myRank} in Trivia Royale with ${myScore} pts on ARENA 🦠 arenagameplay.vercel.app`;

  const {
    sharing, copyDone, downloadDone,
    shareNative, shareTwitter, shareWhatsApp, copyImage, downloadImage,
  } = useShareResult({ shareText });

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md slide-up-1">

      {/* Headline */}
      <div className="flex flex-col items-center gap-2">
        {iWon
          ? <Crown size={56} strokeWidth={1.25} className="text-amber" />
          : <Trophy size={56} strokeWidth={1.25} className="text-muted" />
        }
        <h2 className={`font-display text-5xl tracking-arena ${iWon ? "text-amber" : "text-text"}`}>
          {iWon ? "CHAMPION" : `#${myRank}`}
        </h2>
        <p className="font-mono text-xs text-dim">
          {totalQuestions} questions · {leaderboard.length} players
        </p>
        <p className="font-mono text-sm text-muted">
          Your score: <span className="text-amber">{myScore}</span> pts
        </p>
      </div>

      {/* Final leaderboard */}
      <div className="w-full bracket-card bg-surface border border-border rounded-sm p-5 flex flex-col gap-3">
        <div className="rule-label"><span>final standings</span></div>

        {leaderboard.map((entry, i) => (
          <div
            key={entry.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-sm border ${
              entry.id === myId
                ? "bg-amber/10 border-amber/30"
                : i === 0
                ? "bg-amber/5 border-amber/20"
                : "bg-bg border-border"
            }`}
          >
            <span className={`font-display text-2xl w-8 text-center ${
              i === 0 ? "text-amber" : i === 1 ? "text-muted" : "text-dim"
            }`}>
              {i + 1}
            </span>
            <Avatar name={entry.name} color={entry.avatarColor} size="sm" />
            <span className="font-mono text-xs text-muted flex-1 truncate">
              {entry.name}
              {entry.id === myId && (
                <span className="ml-1.5 text-[9px] bg-amber/10 text-amber border border-amber/30 rounded px-1 tracking-widest uppercase">you</span>
              )}
            </span>
            <span className={`font-display text-2xl ${i === 0 ? "text-amber" : "text-text"}`}>
              {entry.score}
            </span>
            {i === 0 && <Crown size={16} className="text-amber shrink-0" />}
          </div>
        ))}
      </div>

      {/* Share panel */}
      <SharePanel
        sharing={sharing} copyDone={copyDone} downloadDone={downloadDone}
        shareNative={shareNative} shareTwitter={shareTwitter}
        shareWhatsApp={shareWhatsApp} copyImage={copyImage} downloadImage={downloadImage}
      />

      <div className="flex gap-3 w-full">
        <Button variant="secondary" size="md" fullWidth onClick={() => navigate("/lobby")}>
          Back to Lobby
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={() => navigate("/")}>
          Change Name
        </Button>
      </div>
    </div>
  );
}
