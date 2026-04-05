import { useNavigate } from "react-router-dom";

import type { Player } from "../../../types";
import type { WyrMatchOver } from "../../../hooks/useWouldYouRather";
import { useShareResult } from "../../../hooks/useShareResult";
import GameShareCard from "../../ui/GameShareCard";
import SharePanel from "../../ui/SharePanel";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";

type Props = {
  matchOver: WyrMatchOver;
  players:   Player[];
  myId:      string;
};

export default function WyrResultScreen({ matchOver, players, myId }: Props) {
  const navigate = useNavigate();

  const me       = players.find((p) => p.id === myId);
  const opponent = players.find((p) => p.id !== myId);
  const total    = matchOver.agrees + matchOver.disagrees;
  const pct      = total > 0 ? Math.round((matchOver.agrees / total) * 100) : 0;

  const vibe = pct >= 80
    ? { label: "SOULMATES", color: "text-green", emoji: "💚" }
    : pct >= 60
    ? { label: "GREAT MATCH", color: "text-amber", emoji: "🤝" }
    : pct >= 40
    ? { label: "HALF & HALF", color: "text-muted", emoji: "⚖️" }
    : { label: "POLAR OPPOSITES", color: "text-red", emoji: "🔥" };

  const shareText = `${pct}% compatible with ${opponent?.name ?? "my friend"} in Would You Rather on ARENA ⚡ ${vibe.label} · arenagameplay.vercel.app`;

  const {
    cardRef, sharing, copyDone, downloadDone,
    shareNative, shareTwitter, shareWhatsApp, copyImage, downloadImage,
  } = useShareResult({ shareText });

  const tagline = vibe.label + " — " + pct + "% compatible";

  return (
    <>
      <GameShareCard
        gameLabel="Would You Rather"
        winnerId={null}
        myId={myId}
        players={players}
        myScore={matchOver.agrees}
        oppScore={matchOver.disagrees}
        totalRounds={matchOver.totalRounds}
        tagline={tagline}
        cardRef={cardRef}
      />

      <div className="flex flex-col items-center gap-8 w-full max-w-md slide-up-1">

        {/* Headline */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">{vibe.emoji}</span>
          <h2 className={`font-display text-4xl sm:text-5xl tracking-arena ${vibe.color}`}>
            {vibe.label}
          </h2>
          <p className="font-mono text-xs text-dim">
            {matchOver.totalRounds} question{matchOver.totalRounds !== 1 ? "s" : ""} answered
          </p>
        </div>

        {/* Stats card */}
        <div className="bracket-card w-full bg-surface border border-border rounded-sm p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-2">
              <Avatar name={me?.name ?? "You"} color={me?.avatarColor ?? "amber"} size="lg" />
              <span className="font-mono text-xs text-muted">
                {me?.name ?? "You"}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className={`font-display text-6xl leading-none ${vibe.color}`}>
                {pct}%
              </span>
              <span className="font-mono text-[10px] text-dim tracking-widest">
                COMPATIBLE
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar name={opponent?.name ?? "?"} color={opponent?.avatarColor ?? "cyan"} size="lg" />
              <span className="font-mono text-xs text-muted">
                {opponent?.name ?? "Opponent"}
              </span>
            </div>
          </div>

          <div className="rule-label"><span>breakdown</span></div>

          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-3xl text-green">{matchOver.agrees}</span>
              <span className="font-mono text-[9px] text-dim tracking-widest uppercase">Agreed</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-3xl text-red">{matchOver.disagrees}</span>
              <span className="font-mono text-[9px] text-dim tracking-widest uppercase">Disagreed</span>
            </div>
          </div>

          <p className="text-center font-mono text-xs text-muted">
            {pct >= 80
              ? "You two think alike! Are you secretly the same person?"
              : pct >= 60
              ? "Pretty compatible! You'd survive a road trip together."
              : pct >= 40
              ? "Some overlap, some friction. Keeps it interesting."
              : "You see the world very differently. Opposites attract?"}
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
