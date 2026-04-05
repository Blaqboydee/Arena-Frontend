import { useState } from "react";
import type { Player } from "../../../types";
import { useHangman } from "../../../hooks/useHangman";
import HmResultScreen from "./HmResultScreen";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

// ── Hangman caricature SVG ────────────────────────────────────────────────────

function HangmanFigure({ wrongCount, maxWrong }: { wrongCount: number; maxWrong: number }) {
  const dead = wrongCount >= maxWrong;
  const col  = dead ? "#ef4444" : "#f59e0b";
  const dim  = "#3f3f46";

  return (
    <svg viewBox="0 0 140 170" className="w-full h-full" style={{ maxWidth: 140, maxHeight: 170 }}>
      {/* Gallows — always visible */}
      <line x1="20" y1="160" x2="120" y2="160" stroke={dim} strokeWidth="3" strokeLinecap="round" />
      <line x1="40" y1="160" x2="40" y2="20"   stroke={dim} strokeWidth="3" strokeLinecap="round" />
      <line x1="40" y1="20"  x2="85" y2="20"   stroke={dim} strokeWidth="3" strokeLinecap="round" />
      <line x1="85" y1="20"  x2="85" y2="32"   stroke={dim} strokeWidth="2" />

      {/* 1 — Hat */}
      {wrongCount >= 1 && (
        <g>
          <rect x="72" y="28" width="26" height="4" rx="1" fill={col} opacity={0.9} />
          <rect x="76" y="18" width="18" height="10" rx="2" fill={col} opacity={0.9} />
        </g>
      )}

      {/* 2 — Head (with face) */}
      {wrongCount >= 2 && (
        <g>
          <circle cx="85" cy="46" r="14" fill="none" stroke={col} strokeWidth="2" />
          {dead ? (
            <>
              <line x1="79" y1="42" x2="83" y2="46" stroke="#ef4444" strokeWidth="1.5" />
              <line x1="83" y1="42" x2="79" y2="46" stroke="#ef4444" strokeWidth="1.5" />
              <line x1="87" y1="42" x2="91" y2="46" stroke="#ef4444" strokeWidth="1.5" />
              <line x1="91" y1="42" x2="87" y2="46" stroke="#ef4444" strokeWidth="1.5" />
            </>
          ) : (
            <>
              <circle cx="80" cy="44" r="1.5" fill={col} />
              <circle cx="90" cy="44" r="1.5" fill={col} />
            </>
          )}
          {dead ? (
            <line x1="81" y1="52" x2="89" y2="52" stroke="#ef4444" strokeWidth="1.5" />
          ) : (
            <path d="M81 51 Q85 54 89 51" fill="none" stroke={col} strokeWidth="1" />
          )}
        </g>
      )}

      {/* 3 — Body */}
      {wrongCount >= 3 && (
        <line x1="85" y1="60" x2="85" y2="100" stroke={col} strokeWidth="2" />
      )}

      {/* 4 — Left arm */}
      {wrongCount >= 4 && (
        <line x1="85" y1="70" x2="65" y2="88" stroke={col} strokeWidth="2" strokeLinecap="round" />
      )}

      {/* 5 — Right arm */}
      {wrongCount >= 5 && (
        <line x1="85" y1="70" x2="105" y2="88" stroke={col} strokeWidth="2" strokeLinecap="round" />
      )}

      {/* 6 — Left leg */}
      {wrongCount >= 6 && (
        <line x1="85" y1="100" x2="65" y2="125" stroke={col} strokeWidth="2" strokeLinecap="round" />
      )}

      {/* 7 — Right leg (the last limb) */}
      {wrongCount >= 7 && (
        <line x1="85" y1="100" x2="105" y2="125" stroke={col} strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

// ── Word tiles ────────────────────────────────────────────────────────────────

function WordTiles({
  maskedWord,
  fullWord,
  revealed,
}: {
  maskedWord: string[];
  fullWord:   string | null;
  revealed:   boolean;
}) {
  const display = revealed && fullWord
    ? fullWord.split("")
    : fullWord
    ? fullWord.split("")
    : maskedWord;

  const isSetterView = !!fullWord && !revealed;

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
      {display.map((ch, i) => {
        const isHidden   = ch === "_";
        const isRevealed = !isHidden;

        return (
          <div
            key={i}
            className={`
              w-9 h-12 sm:w-11 sm:h-14 flex items-center justify-center
              rounded-sm border transition-all duration-300
              ${revealed && isRevealed
                ? "bg-amber/10 border-amber/50"
                : isSetterView
                ? "bg-elevated border-border-bright"
                : isRevealed
                ? "bg-green/10 border-green/40"
                : "bg-surface border-border"
              }
            `}
          >
            {isHidden ? (
              <span className="text-border text-lg select-none">?</span>
            ) : (
              <span className={`font-display text-xl sm:text-2xl tracking-wide ${
                revealed ? "text-amber" : isSetterView ? "text-muted" : "text-text"
              }`}>
                {ch}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── QWERTY keyboard ───────────────────────────────────────────────────────────

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

function Keyboard({
  guessedLetters,
  word,
  disabled,
  onGuess,
}: {
  guessedLetters: string[];
  word?:          string;
  disabled:       boolean;
  onGuess:        (letter: string) => void;
}) {
  const guessedSet = new Set(guessedLetters);

  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      {KEYBOARD_ROWS.map((row, ri) => (
        <div key={ri} className="flex items-center gap-1 sm:gap-1.5">
          {row.map((letter) => {
            const isGuessed = guessedSet.has(letter);
            const isCorrect = isGuessed && word?.includes(letter);
            const isWrong   = isGuessed && word ? !word.includes(letter) : false;

            return (
              <button
                key={letter}
                disabled={isGuessed || disabled}
                onClick={() => onGuess(letter)}
                className={`
                  w-7 h-9 sm:w-8 sm:h-10 flex items-center justify-center
                  rounded-sm font-mono text-xs sm:text-sm font-medium
                  transition-all duration-150 select-none
                  ${isCorrect
                    ? "bg-green/20 text-green border border-green/40"
                    : isWrong
                    ? "bg-red/10 text-red/50 border border-red/20"
                    : !disabled
                    ? "bg-surface border border-border text-text hover:bg-elevated hover:border-border-bright active:scale-95 cursor-pointer"
                    : "bg-surface/50 border border-border/50 text-dim cursor-default"
                  }
                `}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

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

// ── Confirm End Modal ─────────────────────────────────────────────────────────

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

// ── Body-part counter pills ───────────────────────────────────────────────────

function BodyPartPills({ wrongCount, maxWrong }: { wrongCount: number; maxWrong: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxWrong }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors duration-200 ${
            i < wrongCount ? "bg-red" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}

// ── Word picker (setter's view during "picking" phase) ────────────────────────

function WordPicker({
  onSubmit,
  error,
  timeLeft,
  timerPct,
}: {
  onSubmit:  (word: string) => void;
  error:     string;
  timeLeft:  number;
  timerPct:  number;
}) {
  const [input, setInput] = useState("");

  function handleSubmit() {
    const cleaned = input.trim().replace(/[^a-zA-Z]/g, "");
    if (cleaned.length >= 2) onSubmit(cleaned);
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm slide-up-1">
      <div className="flex flex-col items-center gap-1">
        <span className="text-4xl">📝</span>
        <h3 className="font-display text-2xl tracking-wide text-text">Choose a Word</h3>
        <p className="font-mono text-xs text-muted text-center">
          Pick a word for your opponent to guess. Letters only, 2–14 characters.
        </p>
      </div>

      <div className="w-full flex flex-col gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 14))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Type your word…"
          maxLength={14}
          autoFocus
          className="
            w-full px-4 py-3 rounded-sm
            bg-elevated border border-border text-text
            font-mono text-lg tracking-[6px] uppercase text-center
            placeholder:text-dim placeholder:tracking-widest
            focus:outline-none focus:border-amber/60
            transition-colors duration-150
          "
        />
        {error && (
          <span className="font-mono text-xs text-red text-center">{error}</span>
        )}
      </div>

      <Button variant="primary" size="md" fullWidth onClick={handleSubmit}>
        Set Word
      </Button>

      <div className="w-full flex flex-col gap-1">
        <div className="flex justify-between">
          <span className="font-mono text-[10px] text-muted">Time to pick</span>
          <span className={`font-mono text-xs tabular-nums ${
            timerPct > 50 ? "text-green" : timerPct > 25 ? "text-amber" : "text-red"
          }`}>
            {(timeLeft / 1000).toFixed(0)}s
          </span>
        </div>
        <TimerBar pct={timerPct} />
      </div>
    </div>
  );
}

// ── Hint input (setter's view during "hint" phase) ────────────────────────────

function HintInput({
  onSubmit,
  error,
  timeLeft,
  timerPct,
}: {
  onSubmit:  (hint: string) => void;
  error:     string;
  timeLeft:  number;
  timerPct:  number;
}) {
  const [input, setInput] = useState("");

  return (
    <div className="w-full bg-amber/5 border border-amber/30 rounded-sm p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="font-display text-lg text-amber tracking-wide">
          💡 Give a Hint!
        </span>
        <p className="font-mono text-[10px] text-muted">
          One limb left — help your opponent or they lose!
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 100))}
          onKeyDown={(e) => e.key === "Enter" && input.trim() && onSubmit(input.trim())}
          placeholder="Type a hint…"
          maxLength={100}
          autoFocus
          className="
            flex-1 px-3 py-2 rounded-sm
            bg-elevated border border-border text-text
            font-mono text-sm
            placeholder:text-dim
            focus:outline-none focus:border-amber/60
            transition-colors duration-150
          "
        />
        <Button variant="primary" size="sm" onClick={() => input.trim() && onSubmit(input.trim())}>
          Send
        </Button>
      </div>

      {error && (
        <span className="font-mono text-xs text-red">{error}</span>
      )}

      <div className="w-full flex flex-col gap-1">
        <div className="flex justify-end">
          <span className={`font-mono text-xs tabular-nums ${
            timerPct > 50 ? "text-green" : timerPct > 25 ? "text-amber" : "text-red"
          }`}>
            {(timeLeft / 1000).toFixed(0)}s
          </span>
        </div>
        <TimerBar pct={timerPct} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Hangman({ roomId, myId, players }: Props) {
  const {
    phase, maskedWord, guessedLetters,
    wrongCount, maxWrong, roundNumber,
    hint, word,
    roundResult, matchOver,
    timeLeft, timerPct,
    isSetter, isGuesser,
    me, opponent, myScore, oppScore,
    pickError, hintError,
    showConfirmEnd,
    submitWord, guessLetter, giveHint,
    requestEndMatch, confirmEndMatch, cancelEndMatch,
  } = useHangman({ roomId, myId, players });

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
    return <HmResultScreen matchOver={matchOver} players={players} myId={myId} />;
  }

  // ── Picking phase (setter chooses word) ────────────────────────────────────
  if (phase === "picking") {
    if (isSetter) {
      return <WordPicker onSubmit={submitWord} error={pickError} timeLeft={timeLeft} timerPct={timerPct} />;
    }
    return (
      <div className="flex flex-col items-center gap-4 slide-up-1">
        <div className="w-10 h-10 rounded-full border-2 border-border border-t-amber animate-spin" />
        <p className="font-mono text-sm text-muted tracking-widest">
          {opponent?.name ?? "Opponent"} is choosing a word…
        </p>
        <span className="font-mono text-[10px] text-dim tracking-[4px] uppercase">
          Round {roundNumber}
        </span>
      </div>
    );
  }

  // ── Active game (guessing / hint / round_over) ─────────────────────────────

  const isRoundOver  = phase === "round_over";
  const revealedWord = roundResult?.word ?? null;

  const myRole  = isSetter ? "Setter" : "Guesser";
  const oppRole = isSetter ? "Guesser" : "Setter";

  let statusText  = "";
  let statusColor = "text-muted";

  if (isRoundOver) {
    if (roundResult?.winnerId === myId) {
      statusText  = "✅ You won this round!";
      statusColor = "text-green";
    } else if (roundResult?.winnerId) {
      statusText  = `❌ ${roundResult.winnerName} won this round`;
      statusColor = "text-red";
    } else {
      statusText  = "🤝 Draw!";
    }
  } else if (phase === "hint") {
    statusText  = isSetter ? "💡 Give your opponent a hint!" : "💡 Waiting for hint…";
    statusColor = "text-amber";
  } else if (isGuesser) {
    statusText  = "Your turn — guess a letter";
    statusColor = "text-amber";
  } else {
    statusText  = `${opponent?.name ?? "Opponent"} is guessing…`;
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">

      {/* ── Scoreboard ── */}
      <div className="w-full bg-surface border border-border rounded-sm px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar name={me?.name ?? "You"} color={me?.avatarColor ?? "amber"} size="sm" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-muted">{me?.name ?? "You"}</span>
              <span className="font-mono text-[8px] bg-amber/10 text-amber border border-amber/30 rounded px-1 tracking-widest uppercase">
                {myRole}
              </span>
            </div>
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
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[8px] bg-elevated text-muted border border-border rounded px-1 tracking-widest uppercase">
                {oppRole}
              </span>
              <span className="font-mono text-[10px] text-muted">{opponent?.name ?? "Opponent"}</span>
            </div>
            <span className="font-display text-4xl text-text leading-none">{oppScore}</span>
          </div>
        </div>
      </div>

      {/* ── Timer ── */}
      {!isRoundOver && (
        <div className="w-full flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className={`font-mono text-xs transition-colors duration-200 ${statusColor}`}>
              {statusText}
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

      {/* ── Round-over status ── */}
      {isRoundOver && (
        <div className="w-full flex flex-col gap-1.5">
          <span className={`font-mono text-xs text-center ${statusColor}`}>{statusText}</span>
          {roundResult?.reason && (
            <p className="font-mono text-[10px] text-dim text-center">
              {roundResult.reason === "hanged" && "The man was fully hanged!"}
              {roundResult.reason === "guessed" && "The word was guessed correctly!"}
              {roundResult.reason === "timeout" && "Time ran out!"}
              {roundResult.reason === "pick_timeout" && "Setter didn't pick a word in time."}
              {roundResult.reason === "no_hint" && "Setter didn't give a hint in time — guesser wins!"}
            </p>
          )}
        </div>
      )}

      {/* ── Hangman figure + wrong counter ── */}
      <div className="flex flex-col items-center gap-2">
        <HangmanFigure wrongCount={wrongCount} maxWrong={maxWrong} />
        <BodyPartPills wrongCount={wrongCount} maxWrong={maxWrong} />
      </div>

      {/* ── Word tiles ── */}
      <WordTiles
        maskedWord={maskedWord}
        fullWord={isRoundOver ? revealedWord : (isSetter ? word : null)}
        revealed={isRoundOver}
      />

      {/* ── Revealed word on round end ── */}
      {isRoundOver && revealedWord && (
        <p className="font-mono text-xs text-dim">
          The word was <span className="text-amber font-bold">{revealedWord}</span>
        </p>
      )}

      {/* ── Hint display (guesser sees hint after setter sends it) ── */}
      {hint && phase === "guessing" && isGuesser && (
        <div className="w-full bg-amber/5 border border-amber/30 rounded-sm px-4 py-3">
          <span className="font-mono text-[10px] text-amber tracking-widest uppercase block mb-1">
            💡 Hint
          </span>
          <p className="font-mono text-sm text-text">{hint}</p>
        </div>
      )}

      {/* ── Hint display (setter sees their own hint) ── */}
      {hint && phase === "guessing" && isSetter && (
        <div className="w-full bg-surface border border-border rounded-sm px-4 py-3">
          <span className="font-mono text-[10px] text-muted tracking-widest uppercase block mb-1">
            Your hint
          </span>
          <p className="font-mono text-sm text-muted italic">"{hint}"</p>
        </div>
      )}

      {/* ── Hint input (setter, hint phase) ── */}
      {phase === "hint" && isSetter && (
        <HintInput onSubmit={giveHint} error={hintError} timeLeft={timeLeft} timerPct={timerPct} />
      )}

      {/* ── Waiting for hint (guesser, hint phase) ── */}
      {phase === "hint" && isGuesser && (
        <div className="w-full bg-amber/5 border border-amber/30 rounded-sm p-4 flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-amber/40 border-t-amber animate-spin shrink-0" />
          <p className="font-mono text-xs text-amber">
            {opponent?.name ?? "Setter"} is writing you a hint…
          </p>
        </div>
      )}

      {/* ── Keyboard (guesser, during guessing / round_over) ── */}
      {(phase === "guessing" || isRoundOver) && (
        <Keyboard
          guessedLetters={guessedLetters}
          word={isRoundOver ? revealedWord ?? undefined : word ?? undefined}
          disabled={!isGuesser || isRoundOver}
          onGuess={guessLetter}
        />
      )}

      {/* ── Setter waiting text during guessing ── */}
      {phase === "guessing" && isSetter && !hint && (
        <p className="font-mono text-[10px] text-dim tracking-widest text-center">
          Watch your opponent guess…
        </p>
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
