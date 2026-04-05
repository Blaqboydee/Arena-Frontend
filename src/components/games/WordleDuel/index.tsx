import { useEffect, useCallback } from "react";
import type { Player } from "../../../types";
import { useWordleDuel } from "../../../hooks/useWordleDuel";
import WdlResultScreen from "./WdlResultScreen";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

// ── Tile colors ───────────────────────────────────────────────────────────────

const GRADE_BG: Record<string, string> = {
  correct: "bg-green border-green/50",
  present: "bg-amber border-amber/50",
  absent:  "bg-elevated border-border",
};

const GRADE_TEXT: Record<string, string> = {
  correct: "text-bg",
  present: "text-bg",
  absent:  "text-muted",
};

// ── Keyboard layout ──────────────────────────────────────────────────────────

const KB_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

const KEY_GRADE_BG: Record<string, string> = {
  correct: "bg-green text-bg",
  present: "bg-amber text-bg",
  absent:  "bg-elevated text-dim",
};

// ── ConfirmEndModal ───────────────────────────────────────────────────────────

function ConfirmEndModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bg/80 backdrop-blur-sm">
      <div className="bracket-card bg-surface border border-border rounded-sm p-8 w-full max-w-xs flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-2xl tracking-wide text-text">End Match?</h3>
          <p className="font-mono text-xs text-muted">
            Current scores will be tallied and the match will be over for both players.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" fullWidth onClick={onCancel}>Cancel</Button>
          <Button variant="danger" size="sm" fullWidth onClick={onConfirm}>End Match</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function WordleDuel({ roomId, myId, players }: Props) {
  const {
    guesses, currentGuess, solved, finished,
    roundNumber, phase, roundResult, matchOver,
    showConfirmEnd, invalidShake, toastMsg,
    oppGuessCount, oppFinished, oppSolved,
    me, opponent, myScore, oppScore,
    letterStates, addLetter, removeLetter, submitGuess,
    requestEndMatch, confirmEndMatch, cancelEndMatch,
    wordLength, maxGuesses,
  } = useWordleDuel({ roomId, myId, players });

  const keyStates = letterStates();

  // ── Physical keyboard handler ──────────────────────────────────────────────

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (phase !== "playing" || finished) return;

    if (e.key === "Enter") {
      e.preventDefault();
      submitGuess();
    } else if (e.key === "Backspace") {
      e.preventDefault();
      removeLetter();
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      addLetter(e.key);
    }
  }, [phase, finished, submitGuess, removeLetter, addLetter]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
    return <WdlResultScreen matchOver={matchOver} players={players} myId={myId} />;
  }

  // ── Build grid rows ────────────────────────────────────────────────────────

  const gridRows: { letters: string[]; grades: (string | null)[] }[] = [];

  // Submitted guesses
  for (const g of guesses) {
    gridRows.push({
      letters: g.word.split(""),
      grades:  g.grade,
    });
  }

  // Current guess row (only if not finished)
  if (!finished && gridRows.length < maxGuesses) {
    const letters = currentGuess.split("");
    while (letters.length < wordLength) letters.push("");
    gridRows.push({ letters, grades: Array(wordLength).fill(null) });
  }

  // Empty remaining rows
  while (gridRows.length < maxGuesses) {
    gridRows.push({
      letters: Array(wordLength).fill(""),
      grades:  Array(wordLength).fill(null),
    });
  }

  const currentRow = guesses.length;

  // ── Status text ────────────────────────────────────────────────────────────

  const statusText =
    phase === "round_over"
      ? roundResult?.winnerId === myId
        ? "✅ You won this round!"
        : roundResult?.winnerId
        ? `❌ ${roundResult.winnerName} won this round`
        : "🤝 Draw!"
      : solved
      ? "✅ Solved! Waiting for opponent…"
      : finished
      ? "❌ Out of guesses. Waiting…"
      : "Type your guess";

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">

      {/* ── Scoreboard ── */}
      <div className="w-full bg-surface border border-border rounded-sm px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar name={me?.name ?? "You"} color={me?.avatarColor ?? "amber"} size="sm" />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-muted">{me?.name ?? "You"}</span>
            <span className="font-display text-4xl text-text leading-none">{myScore}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="font-display text-base tracking-[4px] text-dim">VS</span>
          {roundNumber > 0 && (
            <span className="font-mono text-[9px] text-dim tracking-widest">R{roundNumber}</span>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-row-reverse">
          <Avatar name={opponent?.name ?? "?"} color={opponent?.avatarColor ?? "cyan"} size="sm" />
          <div className="flex flex-col items-end">
            <span className="font-mono text-[10px] text-muted">{opponent?.name ?? "Opponent"}</span>
            <span className="font-display text-4xl text-text leading-none">{oppScore}</span>
          </div>
        </div>
      </div>

      {/* ── Opponent progress ── */}
      <div className="w-full flex items-center justify-between px-1">
        <span className={`font-mono text-xs transition-colors duration-200 ${
          phase === "round_over"
            ? roundResult?.winnerId === myId ? "text-green" : roundResult?.winnerId ? "text-red" : "text-muted"
            : "text-muted"
        }`}>
          {statusText}
        </span>
        {phase === "playing" && (
          <span className="font-mono text-[10px] text-dim">
            {oppFinished
              ? (oppSolved ? "✅ Solved" : "❌ Failed")
              : `Opp: ${oppGuessCount}/${maxGuesses}`
            }
          </span>
        )}
      </div>

      {/* ── Round result — show answer + opponent grid ── */}
      {phase === "round_over" && roundResult && (
        <div className="w-full bg-surface border border-border rounded-sm px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted">Answer:</span>
            <span className="font-display text-lg tracking-widest text-green uppercase">
              {roundResult.answer}
            </span>
          </div>
          {/* Mini opponent grid */}
          {opponent && roundResult.playerResults[opponent.id] && (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] text-dim">{opponent.name}'s guesses:</span>
              <div className="flex gap-0.5">
                {roundResult.playerResults[opponent.id].guesses.map((g, i) => (
                  <div key={i} className="flex gap-px">
                    {g.grade.map((gr, j) => (
                      <div
                        key={j}
                        className={`w-2 h-2 rounded-sm ${
                          gr === "correct" ? "bg-green" : gr === "present" ? "bg-amber" : "bg-elevated"
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Toast ── */}
      {toastMsg && (
        <div className="bg-text text-bg font-mono text-xs px-4 py-2 rounded-sm shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* ── Word Grid ── */}
      <div className={`flex flex-col gap-1 ${invalidShake ? "animate-shake" : ""}`}>
        {gridRows.map((row, r) => (
          <div key={r} className="flex gap-1 justify-center">
            {row.letters.map((letter, c) => {
              const grade = row.grades[c];
              const isCurrent = r === currentRow && !finished;
              const hasLetter = letter !== "";

              return (
                <div
                  key={c}
                  className={`
                    w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center
                    border rounded-sm font-display text-xl sm:text-2xl uppercase
                    transition-all duration-200 select-none
                    ${grade
                      ? `${GRADE_BG[grade]} ${GRADE_TEXT[grade]}`
                      : isCurrent && hasLetter
                      ? "border-border-bright bg-surface text-text"
                      : "border-border bg-surface text-text"
                    }
                  `}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Keyboard ── */}
      {phase === "playing" && !finished && (
        <div className="flex flex-col gap-1 w-full mt-2">
          {KB_ROWS.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-1">
              {row.map((key) => {
                const isSpecial = key === "ENTER" || key === "⌫";
                const kState = keyStates[key.toLowerCase()];

                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === "ENTER") submitGuess();
                      else if (key === "⌫") removeLetter();
                      else addLetter(key);
                    }}
                    className={`
                      ${isSpecial ? "px-3 sm:px-4" : "w-8 sm:w-9"} h-10 sm:h-11
                      rounded-sm font-mono text-xs sm:text-sm
                      transition-all duration-150 select-none
                      ${kState
                        ? KEY_GRADE_BG[kState]
                        : "bg-surface border border-border text-muted hover:bg-elevated hover:border-border-bright"
                      }
                    `}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── End match ── */}
      <button
        onClick={requestEndMatch}
        className="font-mono text-[11px] text-dim hover:text-red tracking-widest uppercase transition-colors duration-150 mt-1"
      >
        End Match
      </button>

      {showConfirmEnd && (
        <ConfirmEndModal onConfirm={confirmEndMatch} onCancel={cancelEndMatch} />
      )}
    </div>
  );
}
