import type { Player } from "../../../types";
import { useWouldYouRather } from "../../../hooks/useWouldYouRather";
import WyrResultScreen from "./WyrResultScreen";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

// ── Timer bar ─────────────────────────────────────────────────────────────────

function TimerBar({ pct }: { pct: number }) {
  const color = pct > 50 ? "bg-green" : pct > 25 ? "bg-amber" : "bg-red";
  return (
    <div className="w-full h-1 bg-border rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-[width] duration-100 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── ConfirmEndModal ───────────────────────────────────────────────────────────

function ConfirmEndModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bg/80 backdrop-blur-sm">
      <div className="bracket-card bg-surface border border-border rounded-sm p-8 w-full max-w-xs flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-2xl tracking-wide text-text">End Session?</h3>
          <p className="font-mono text-xs text-muted">
            Your compatibility stats will be shown and the session ends.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" fullWidth onClick={onCancel}>Cancel</Button>
          <Button variant="danger" size="sm" fullWidth onClick={onConfirm}>End Session</Button>
        </div>
      </div>
    </div>
  );
}

// ── Choice card ───────────────────────────────────────────────────────────────

function ChoiceCard({
  label, option, selected, revealed, opponentPicked, locked, onClick,
}: {
  label:          string;
  option:         "a" | "b";
  selected:       boolean;
  revealed:       boolean;
  opponentPicked: boolean;
  locked:         boolean;
  onClick:        () => void;
}) {
  const isA = option === "a";

  const baseColor = isA
    ? "border-amber/30 hover:border-amber hover:bg-amber/5"
    : "border-cyan/30 hover:border-cyan hover:bg-cyan/5";

  const selectedColor = isA
    ? "border-amber bg-amber/10 ring-1 ring-amber/30"
    : "border-cyan bg-cyan/10 ring-1 ring-cyan/30";

  const revealedColor = selected
    ? (isA ? "border-amber bg-amber/10" : "border-cyan bg-cyan/10")
    : "border-border bg-surface opacity-60";

  const revealedOpp = opponentPicked && !selected
    ? (isA ? "ring-1 ring-amber/50" : "ring-1 ring-cyan/50")
    : "";

  return (
    <button
      onClick={onClick}
      disabled={locked || revealed}
      className={`
        w-full p-5 sm:p-6 rounded-sm border transition-all duration-200
        flex flex-col gap-2 text-left select-none
        ${revealed
          ? `${revealedColor} ${revealedOpp}`
          : selected
          ? selectedColor
          : locked
          ? "border-border bg-surface opacity-60 cursor-default"
          : `bg-surface ${baseColor} cursor-pointer`
        }
      `}
    >
      <span className={`font-display text-sm tracking-widest uppercase ${
        isA ? "text-amber" : "text-cyan"
      }`}>
        Option {option.toUpperCase()}
      </span>
      <span className="font-mono text-sm text-text leading-relaxed">
        {label}
      </span>
      {revealed && (selected || opponentPicked) && (
        <div className="flex gap-1 mt-1">
          {selected && (
            <span className="font-mono text-[9px] bg-amber/10 text-amber border border-amber/30 rounded px-1.5 py-0.5 tracking-widest uppercase">
              you
            </span>
          )}
          {opponentPicked && (
            <span className="font-mono text-[9px] bg-cyan/10 text-cyan border border-cyan/30 rounded px-1.5 py-0.5 tracking-widest uppercase">
              them
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function WouldYouRather({ roomId, myId, players }: Props) {
  const {
    question, myChoice, oppChose, reveal,
    roundNumber, agrees, disagrees,
    phase, matchOver, showConfirmEnd,
    timeLeft, timerPct,
    me, opponent,
    choose, requestEndMatch, confirmEndMatch, cancelEndMatch,
  } = useWouldYouRather({ roomId, myId, players });

  // ── Pending ────────────────────────────────────────────────────────────────
  if (phase === "pending") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-border border-t-amber animate-spin" />
        <p className="font-mono text-sm text-muted tracking-widest">Starting…</p>
      </div>
    );
  }

  // ── Match over ─────────────────────────────────────────────────────────────
  if (phase === "match_over" && matchOver) {
    return <WyrResultScreen matchOver={matchOver} players={players} myId={myId} />;
  }

  const isRevealed = phase === "revealed" && reveal !== null;
  const oppId      = opponent?.id ?? "";
  const oppChoice  = reveal?.choices[oppId] ?? null;

  // Agreement badge
  const agreeText = isRevealed
    ? reveal.agreed
      ? "🤝 You agree!"
      : "🔥 You disagree!"
    : myChoice
    ? "Waiting for opponent…"
    : oppChose
    ? "Opponent has chosen!"
    : "Choose one!";

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">

      {/* ── Stats bar ── */}
      <div className="w-full bg-surface border border-border rounded-sm px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar name={me?.name ?? "You"} color={me?.avatarColor ?? "amber"} size="sm" />
          <span className="font-mono text-[10px] text-muted">{me?.name ?? "You"}</span>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="font-display text-base tracking-[4px] text-dim">WYR</span>
          {roundNumber > 0 && (
            <span className="font-mono text-[9px] text-dim tracking-widest">R{roundNumber}</span>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-row-reverse">
          <Avatar name={opponent?.name ?? "?"} color={opponent?.avatarColor ?? "cyan"} size="sm" />
          <span className="font-mono text-[10px] text-muted">{opponent?.name ?? "Opponent"}</span>
        </div>
      </div>

      {/* ── Compatibility stats ── */}
      <div className="w-full flex items-center justify-center gap-4">
        <span className="font-mono text-[10px] text-green">🤝 {agrees}</span>
        <span className="font-mono text-[10px] text-dim">·</span>
        <span className="font-mono text-[10px] text-red">🔥 {disagrees}</span>
        {(agrees + disagrees) > 0 && (
          <>
            <span className="font-mono text-[10px] text-dim">·</span>
            <span className="font-mono text-[10px] text-muted">
              {Math.round((agrees / (agrees + disagrees)) * 100)}% alike
            </span>
          </>
        )}
      </div>

      {/* ── Timer ── */}
      {phase === "choosing" && (
        <div className="w-full flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className={`font-mono text-xs ${
              myChoice ? "text-green" : oppChose ? "text-amber" : "text-muted"
            }`}>
              {agreeText}
            </span>
            <span className={`font-mono text-xs tabular-nums ${
              timerPct > 50 ? "text-green" : timerPct > 25 ? "text-amber" : "text-red"
            }`}>
              {(timeLeft / 1000).toFixed(1)}s
            </span>
          </div>
          <TimerBar pct={timerPct} />
        </div>
      )}

      {/* ── Revealed badge ── */}
      {isRevealed && (
        <div className={`w-full text-center py-2 rounded-sm font-mono text-sm ${
          reveal.agreed
            ? "bg-green/10 text-green border border-green/30"
            : "bg-red/10 text-red border border-red/30"
        }`}>
          {agreeText}
        </div>
      )}

      {/* ── Question ── */}
      {question && (
        <div className="w-full flex flex-col items-center gap-2 py-2">
          <span className="font-display text-xl sm:text-2xl tracking-wide text-text text-center">
            Would You Rather…
          </span>
        </div>
      )}

      {/* ── Choice cards ── */}
      {question && (
        <div className="w-full flex flex-col gap-3">
          <ChoiceCard
            label={question.a}
            option="a"
            selected={myChoice === "a"}
            revealed={isRevealed}
            opponentPicked={oppChoice === "a"}
            locked={myChoice !== null && !isRevealed}
            onClick={() => choose("a")}
          />

          <div className="flex items-center gap-3 px-4">
            <div className="flex-1 h-px bg-border" />
            <span className="font-display text-sm text-dim tracking-widest">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <ChoiceCard
            label={question.b}
            option="b"
            selected={myChoice === "b"}
            revealed={isRevealed}
            opponentPicked={oppChoice === "b"}
            locked={myChoice !== null && !isRevealed}
            onClick={() => choose("b")}
          />
        </div>
      )}

      {/* ── End match ── */}
      <button
        onClick={requestEndMatch}
        className="font-mono text-[11px] text-dim hover:text-red tracking-widest uppercase transition-colors duration-150 mt-2"
      >
        End Session
      </button>

      {showConfirmEnd && (
        <ConfirmEndModal onConfirm={confirmEndMatch} onCancel={cancelEndMatch} />
      )}
    </div>
  );
}
