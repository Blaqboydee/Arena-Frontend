import { useNavigate } from "react-router-dom";
import { Share2, X, MessageCircle, Copy, Download, Loader2 } from "lucide-react";
import { Trophy, Skull, Handshake } from "lucide-react";
import type { Player } from "../../../types";
import type { TttMatchOver } from "../../../hooks/useTicTacToe";
import { useShareResult } from "../../../hooks/useShareResult";
import ResultShareCard from "./Resultsharecard";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";

type Props = {
  matchOver: TttMatchOver;
  players:   Player[];
  myId:      string;
};

export default function TttResultScreen({ matchOver, players, myId }: Props) {
  const navigate = useNavigate();

  const iWon     = matchOver.winnerId === myId;
  const isDraw   = matchOver.winnerId === null;
  const me       = players.find((p) => p.id === myId);
  const opponent = players.find((p) => p.id !== myId);
  const myScore  = matchOver.scores[myId] ?? 0;
  const oppScore = opponent ? (matchOver.scores[opponent.id] ?? 0) : 0;

  const shareText = isDraw
    ? `Drew ${myScore}-${oppScore} after ${matchOver.totalRounds} rounds on ARENA ⚡ arenagameplay.vercel.app`
    : iWon
    ? `Beat ${opponent?.name ?? "my opponent"} ${myScore}-${oppScore} in Tic Tac Toe on ARENA ⚡ arenagameplay.vercel.app`
    : `Lost to ${matchOver.winnerName} ${oppScore}-${myScore} in Tic Tac Toe on ARENA ⚡ arenagameplay.vercel.app`;

  const {
    cardRef,
    sharing,
    copyDone,
    downloadDone,
    shareNative,
    shareTwitter,
    shareWhatsApp,
    copyImage,
    downloadImage,
  } = useShareResult({ shareText });

  const ResultIcon = isDraw
    ? <Handshake size={56} strokeWidth={1.25} className="text-muted" />
    : iWon
    ? <Trophy    size={56} strokeWidth={1.25} className="text-amber"  />
    : <Skull     size={56} strokeWidth={1.25} className="text-muted"  />;

  const isBusy = sharing !== null;

  return (
    <>
      {/* Off-screen card — rendered invisibly, used as html-to-image source */}
      <ResultShareCard
        matchOver={matchOver}
        players={players}
        myId={myId}
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
              ? "Dominant. Send the link to a new challenger."
              : `${matchOver.winnerName} takes this one. Rematch?`}
          </p>
        </div>

        {/* Share panel */}
        <div className="w-full flex flex-col gap-3">

          {/* Primary CTA — native share on mobile, download on desktop */}
          {"share" in navigator ? (
            <Button
              variant="primary" size="lg" fullWidth
              onClick={shareNative} disabled={isBusy}
              className="amber-pulse"
            >
              {sharing === "native"
                ? <Loader2 size={15} className="animate-spin" />
                : <Share2  size={15} />}
              <span className="ml-2">Share Result</span>
            </Button>
          ) : (
            <Button
              variant="primary" size="lg" fullWidth
              onClick={downloadImage} disabled={isBusy}
              className="amber-pulse"
            >
              {sharing === "download"
                ? <Loader2  size={15} className="animate-spin" />
                : <Download size={15} />}
              <span className="ml-2">{downloadDone ? "Saved!" : "Save Image"}</span>
            </Button>
          )}

          {/* Platform row */}
          <div className="grid grid-cols-3 gap-2">
            <ShareButton
              label="Twitter"
              loading={sharing === "twitter"}
              done={false}
              onClick={shareTwitter}
              disabled={isBusy}
              icon={<X size={16} className="text-muted" />}
            />
            <ShareButton
              label="WhatsApp"
              loading={sharing === "whatsapp"}
              done={false}
              onClick={shareWhatsApp}
              disabled={isBusy}
              icon={<MessageCircle size={16} className="text-muted" />}
            />
            <ShareButton
              label={copyDone ? "Copied!" : "Copy"}
              loading={sharing === "copy"}
              done={copyDone}
              onClick={copyImage}
              disabled={isBusy}
              icon={<Copy size={16} className={copyDone ? "text-green" : "text-muted"} />}
            />
          </div>
        </div>

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

// ── Small share button ─────────────────────────────────────────────────────────

function ShareButton({
  label, loading, done, onClick, disabled, icon,
}: {
  label:    string;
  loading:  boolean;
  done:     boolean;
  onClick:  () => void;
  disabled: boolean;
  icon:     React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 py-3 px-2
                 bg-surface border border-border rounded-sm
                 hover:border-border-bright hover:bg-elevated
                 transition-all duration-150
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading
        ? <Loader2 size={16} className="animate-spin text-muted" />
        : icon}
      <span className={`font-mono text-[9px] tracking-widest uppercase ${done ? "text-green" : "text-dim"}`}>
        {label}
      </span>
    </button>
  );
}