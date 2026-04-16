import type { Player } from "../../../types";
import { useTriviaRoyale } from "../../../hooks/useTriviaRoyale";
import type { TrivLeaderboardEntry } from "../../../hooks/useTriviaRoyale";
import TrivResultScreen from "./TrivResultScreen";
import Avatar from "../../ui/Avatar";

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

// ── Timer bar ─────────────────────────────────────────────────────────────────

function TimerBar({ pct }: { pct: number }) {
  const color = pct > 50 ? "bg-green" : pct > 25 ? "bg-amber" : "bg-red";
  return (
    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-[width] duration-100 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Option button ─────────────────────────────────────────────────────────────

const OPTION_COLORS = [
  { bg: "bg-red/10", border: "border-red/40", hover: "hover:bg-red/20", text: "text-red", label: "A" },
  { bg: "bg-blue/10", border: "border-blue/40", hover: "hover:bg-blue/20", text: "text-blue", label: "B" },
  { bg: "bg-amber/10", border: "border-amber/40", hover: "hover:bg-amber/20", text: "text-amber", label: "C" },
  { bg: "bg-green/10", border: "border-green/40", hover: "hover:bg-green/20", text: "text-green", label: "D" },
];

function OptionButton({
  index, text, selected, correctAnswer, revealed, onClick,
}: {
  index:          number;
  text:           string;
  selected:       boolean;
  correctAnswer:  number | null;
  revealed:       boolean;
  onClick:        () => void;
}) {
  const c = OPTION_COLORS[index];
  const isCorrect = revealed && correctAnswer === index;
  const isWrong   = revealed && selected && correctAnswer !== index;

  let className = `w-full text-left px-4 py-3 rounded-sm border font-mono text-sm transition-all duration-200 flex items-center gap-3 `;

  if (isCorrect) {
    className += "bg-green/20 border-green text-green";
  } else if (isWrong) {
    className += "bg-red/20 border-red text-red line-through";
  } else if (selected) {
    className += `${c.bg} ${c.border} ${c.text}`;
  } else if (revealed) {
    className += "bg-surface border-border text-dim opacity-50";
  } else {
    className += `bg-surface border-border text-muted ${c.hover} hover:border-border-bright cursor-pointer active:scale-[0.98]`;
  }

  return (
    <button onClick={onClick} disabled={revealed || selected} className={className}>
      <span className={`font-display text-lg ${isCorrect ? "text-green" : isWrong ? "text-red" : c.text}`}>
        {c.label}
      </span>
      <span>{text}</span>
      {isCorrect && <span className="ml-auto text-green">✓</span>}
      {isWrong && <span className="ml-auto text-red">✗</span>}
    </button>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

function Leaderboard({ entries, myId }: { entries: TrivLeaderboardEntry[]; myId: string }) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className={`flex items-center gap-3 px-3 py-2 rounded-sm border ${
            entry.id === myId
              ? "bg-amber/10 border-amber/30"
              : "bg-surface border-border"
          }`}
        >
          <span className={`font-display text-lg w-6 text-center ${
            i === 0 ? "text-amber" : "text-dim"
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
          <span className={`font-display text-xl ${i === 0 ? "text-amber" : "text-text"}`}>
            {entry.score}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TriviaRoyale({ roomId, myId, players }: Props) {
  const {
    phase, question, options, questionNumber, totalQuestions,
    leaderboard, myChoice, answeredCount, reveal,
    matchOver, timeLeft, timerPct, activePlayers,
    me, myScore,
    submitAnswer, requestEndMatch,
  } = useTriviaRoyale({ roomId, myId, players });

  // ── Pending ────────────────────────────────────────────────────────────────
  if (phase === "pending") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-border border-t-amber animate-spin" />
        <p className="font-mono text-sm text-muted tracking-widest">Starting trivia…</p>
        <p className="font-mono text-xs text-dim">{activePlayers.length} players</p>
      </div>
    );
  }

  // ── Match over ─────────────────────────────────────────────────────────────
  if (phase === "match_over" && matchOver) {
    return <TrivResultScreen matchOver={matchOver} myId={myId} />;
  }

  const isRevealed     = phase === "reveal";
  const correctAnswer  = reveal?.correctAnswer ?? null;
  const myResult       = reveal?.playerResults?.[myId];

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-lg">

      {/* ── Header ── */}
      <div className="w-full flex items-center justify-between">
        <span className="font-mono text-[10px] text-dim tracking-[4px] uppercase">
          Q{questionNumber}/{totalQuestions}
        </span>
        <span className="font-mono text-xs text-muted">
          {me?.name} — {myScore} pts
        </span>
        <span className="font-mono text-[10px] text-dim">
          {activePlayers.length} players
        </span>
      </div>

      {/* ── Timer ── */}
      {!isRevealed && (
        <div className="w-full flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-muted">
              {answeredCount}/{activePlayers.length} answered
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

      {/* ── Question ── */}
      <div className="w-full bg-surface border border-border rounded-sm p-5">
        <p className="font-mono text-sm text-text leading-relaxed">
          {question}
        </p>
      </div>

      {/* ── Options ── */}
      <div className="w-full flex flex-col gap-2">
        {options.map((opt, i) => (
          <OptionButton
            key={i}
            index={i}
            text={opt}
            selected={myChoice === i}
            correctAnswer={correctAnswer}
            revealed={isRevealed}
            onClick={() => submitAnswer(i)}
          />
        ))}
      </div>

      {/* ── Reveal feedback ── */}
      {isRevealed && myResult && (
        <div className={`w-full text-center py-2 rounded-sm font-mono text-sm ${
          myResult.correct ? "bg-green/10 text-green" : "bg-red/10 text-red"
        }`}>
          {myResult.correct
            ? `Correct! +${myResult.points} pts`
            : myResult.choice === null
            ? "No answer — 0 pts"
            : "Wrong — 0 pts"
          }
        </div>
      )}

      {/* ── Leaderboard ── */}
      {isRevealed && leaderboard.length > 0 && (
        <div className="w-full flex flex-col gap-2">
          <span className="font-mono text-[10px] text-dim tracking-[4px] uppercase text-center">
            Leaderboard
          </span>
          <Leaderboard entries={leaderboard} myId={myId} />
        </div>
      )}

      {/* ── End match (only in reveal phase) ── */}
      {isRevealed && (
        <button
          onClick={requestEndMatch}
          className="font-mono text-[11px] text-dim hover:text-red tracking-widest uppercase transition-colors duration-150 mt-1"
        >
          End Match
        </button>
      )}
    </div>
  );
}
