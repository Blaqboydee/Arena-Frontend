import { useNavigate } from "react-router-dom";
import type { BombResult } from "../../../hooks/useBombDefusal";
import type { Player } from "../../../types";
import { useShareResult } from "../../../hooks/useShareResult";
import SharePanel from "../../ui/SharePanel";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";

type Props = {
  result:      BombResult;
  me:          Player;
  onPlayAgain: () => void;
};

export default function BombResultScreen({ result, me, onPlayAgain }: Props) {
  const navigate = useNavigate();

  const formatTime = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const shareText = result.success
    ? `Our team defused the bomb in ${formatTime(result.timeUsed)} with ${result.strikes} strike${result.strikes !== 1 ? "s" : ""} on ARENA 💣 arenagameplay.vercel.app`
    : result.reason === "strikes"
    ? `Our team hit ${result.strikes} strikes and the bomb exploded on ARENA 💥 arenagameplay.vercel.app`
    : `Our team ran out of time — the bomb exploded on ARENA 💥 arenagameplay.vercel.app`;

  const {
    sharing, copyDone, downloadDone,
    shareNative, shareTwitter, shareWhatsApp, copyImage, downloadImage,
  } = useShareResult({ shareText });

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md slide-up-1">
      {/* Headline */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-6xl">{result.success ? "🎉" : "💥"}</span>
        <h2 className={`font-display text-5xl tracking-arena ${
          result.success ? "text-green" : "text-red"
        }`}>
          {result.success ? "DEFUSED" : "BOOM"}
        </h2>
        <p className="font-mono text-xs text-dim">
          {result.success
            ? `Bomb defused in ${formatTime(result.timeUsed)}`
            : result.reason === "strikes"
              ? "Too many strikes!"
              : "Time ran out!"
          }
        </p>
      </div>

      {/* Stats */}
      <div className="w-full bracket-card bg-surface border border-border rounded-sm p-5 flex flex-col gap-4">
        <div className="rule-label"><span>mission report</span></div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-1 p-3 rounded-sm border border-border bg-bg">
            <span className="font-display text-2xl text-muted">
              {formatTime(result.timeUsed)}
            </span>
            <span className="font-mono text-[10px] text-dim uppercase">Time Used</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-sm border border-border bg-bg">
            <span className={`font-display text-2xl ${
              result.strikes > 0 ? "text-red" : "text-green"
            }`}>
              {result.strikes}
            </span>
            <span className="font-mono text-[10px] text-dim uppercase">Strikes</span>
          </div>
        </div>

        {/* Team */}
        <div className="rule-label"><span>team</span></div>
        <div className="flex flex-wrap justify-center gap-2">
          {result.players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm border ${
                p.id === me.id ? "border-amber/30 bg-amber/5" : "border-border bg-bg"
              }`}
            >
              <Avatar name={p.name} color={p.avatarColor} size="sm" />
              <span className="font-mono text-xs text-muted">{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share panel */}
      <SharePanel
        sharing={sharing} copyDone={copyDone} downloadDone={downloadDone}
        shareNative={shareNative} shareTwitter={shareTwitter}
        shareWhatsApp={shareWhatsApp} copyImage={copyImage} downloadImage={downloadImage}
      />

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="primary" onClick={onPlayAgain}>
          Play Again
        </Button>
        <Button variant="ghost" onClick={() => navigate("/lobby", { replace: true })}>
          Back to Lobby
        </Button>
      </div>
    </div>
  );
}
