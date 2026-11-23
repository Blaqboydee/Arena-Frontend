import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import socket, { getGuestToken } from "../socket";
import {
  fetchDaily, submitDailyGuess, fetchDailyLeaderboard,
  type DailyState, type DailyLeaderboardEntry, type Grade,
} from "../lib/dailyApi";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";

// ── Tile / key colors (match the multiplayer Wordle) ──────────────────────────
const TILE_BG: Record<Grade, string> = {
  correct: "bg-green border-green/50",
  present: "bg-amber border-amber/50",
  absent:  "bg-elevated border-border",
};
const TILE_TEXT: Record<Grade, string> = {
  correct: "text-bg", present: "text-bg", absent: "text-muted",
};
const KEY_BG: Record<Grade, string> = {
  correct: "bg-green text-bg", present: "bg-amber text-bg", absent: "bg-elevated text-dim",
};

const KEY_ROWS = [
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l"],
  ["enter","z","x","c","v","b","n","m","back"],
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const GRADE_EMOJI: Record<Grade, string> = { correct: "🟩", present: "🟨", absent: "⬛" };

function fmtTime(ms?: number) {
  if (!ms && ms !== 0) return "";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// Best grade seen per letter across all submitted guesses (for the keyboard).
function keyStateMap(guesses: DailyState["guesses"]): Record<string, Grade> {
  const rank: Record<Grade, number> = { absent: 0, present: 1, correct: 2 };
  const map: Record<string, Grade> = {};
  for (const g of guesses) {
    g.word.split("").forEach((ch, i) => {
      const grade = g.grade[i];
      if (!map[ch] || rank[grade] > rank[map[ch]]) map[ch] = grade;
    });
  }
  return map;
}

// Ensure a guest token exists (mint one via the socket if this is a cold start).
function ensureToken(): Promise<void> {
  if (getGuestToken()) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    socket.once("identity", done);
    socket.connect();
    setTimeout(done, 8000);
  });
}

// ── Top bar ───────────────────────────────────────────────────────────────────

function TopBar({ number, streak, onBack }: { number: number; streak: number; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-mono text-[11px] text-muted tracking-widest uppercase hover:text-text active:scale-95 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Lobby
        </button>
        <div className="flex items-center gap-2">
          <span className="font-display text-lg tracking-arena text-text">DAILY</span>
          {number > 0 && <span className="font-mono text-[11px] text-dim tabular-nums">#{number}</span>}
        </div>
        <div className="flex items-center gap-1.5 min-w-[52px] justify-end" title="Daily streak">
          <span className={streak > 0 ? "" : "opacity-40 grayscale"}>🔥</span>
          <span className="font-display text-base text-amber tabular-nums">{streak}</span>
        </div>
      </div>
    </div>
  );
}

// ── Board ─────────────────────────────────────────────────────────────────────

function Board({ state, current }: { state: DailyState; current: string }) {
  const { wordLength, maxAttempts, guesses } = state;
  const activeRow = state.finished ? -1 : guesses.length;

  const rows = Array.from({ length: maxAttempts }, (_, r) => {
    if (r < guesses.length) {
      const g = guesses[r];
      return g.word.split("").map((ch, c) => ({ ch, grade: g.grade[c] as Grade | null }));
    }
    if (r === activeRow) {
      return Array.from({ length: wordLength }, (_, c) => ({ ch: current[c] ?? "", grade: null }));
    }
    return Array.from({ length: wordLength }, () => ({ ch: "", grade: null }));
  });

  return (
    <div className="flex flex-col gap-1.5 items-center">
      {rows.map((row, r) => (
        <div key={r} className="flex gap-1.5">
          {row.map((cell, c) => (
            <div
              key={c}
              className={`w-13 h-13 sm:w-14 sm:h-14 flex items-center justify-center rounded-sm border
                          font-display text-2xl sm:text-3xl uppercase tabular-nums transition-colors
                          ${cell.grade
                            ? `${TILE_BG[cell.grade]} ${TILE_TEXT[cell.grade]}`
                            : cell.ch
                              ? "bg-surface border-border-bright text-text"
                              : "bg-surface border-border text-text"}`}
              style={{ width: "3.1rem", height: "3.1rem" }}
            >
              {cell.ch}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Keyboard ──────────────────────────────────────────────────────────────────

function Keyboard({ states, onKey, disabled }: {
  states: Record<string, Grade>; onKey: (k: string) => void; disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full max-w-md mx-auto select-none">
      {KEY_ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1 sm:gap-1.5">
          {row.map((key) => {
            const special = key === "enter" || key === "back";
            const g = states[key];
            const label = key === "enter" ? "ENTER" : key === "back" ? "⌫" : key.toUpperCase();
            return (
              <button
                key={key}
                onClick={() => !disabled && onKey(key)}
                disabled={disabled}
                className={`h-12 sm:h-14 rounded-sm font-mono uppercase tracking-wide
                            flex items-center justify-center transition-colors active:scale-95
                            disabled:opacity-50
                            ${special ? "px-2.5 text-[10px] flex-[1.4]" : "flex-1 text-sm"}
                            ${g ? KEY_BG[g] : "bg-surface border border-border text-muted hover:bg-elevated hover:border-border-bright"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Result panel ──────────────────────────────────────────────────────────────

function ResultPanel({ state, streak, rank }: { state: DailyState; streak: number; rank: number | null }) {
  const [copied, setCopied] = useState(false);

  function share() {
    const head = `Arena Daily #${state.number} ${state.solved ? state.attempts : "X"}/${state.maxAttempts}`;
    const grid = state.guesses.map((g) => g.grade.map((gr) => GRADE_EMOJI[gr]).join("")).join("\n");
    const text = `${head}\n${grid}\n\nhttps://arenagameplay.app/daily`;
    const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
    if (nav.share) { nav.share({ text }).catch(() => {}); return; }
    navigator.clipboard?.writeText(text).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1800); },
      () => {},
    );
  }

  return (
    <div className="flex flex-col gap-4 bracket-card bg-surface border border-border rounded-sm p-5 slide-up-1">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-3xl">{state.solved ? "🎉" : "💀"}</span>
        <h2 className="font-display text-2xl tracking-wide text-text">
          {state.solved ? `Solved in ${state.attempts}/${state.maxAttempts}` : "Out of guesses"}
        </h2>
        <p className="font-mono text-xs text-muted">
          The word was <span className="font-bold text-amber uppercase tracking-widest">{state.answer}</span>
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Streak" value={`🔥 ${streak}`} />
        <Stat label="Today's rank" value={rank ? `#${rank}` : "—"} accent="text-amber" />
        <Stat label="Time" value={fmtTime(state.timeMs) || "—"} />
      </div>

      <Button variant="secondary" size="sm" fullWidth onClick={share}>
        {copied ? "Copied ✓" : "Share result"}
      </Button>
      <p className="font-mono text-[10px] text-dim text-center">
        New puzzle every day at midnight UTC. Come back tomorrow to keep your streak alive.
      </p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 bg-bg border border-border rounded-sm py-3">
      <span className={`font-display text-lg leading-none ${accent ?? "text-text"}`}>{value}</span>
      <span className="font-mono text-[9px] text-dim tracking-widest uppercase">{label}</span>
    </div>
  );
}

// ── Daily leaderboard ─────────────────────────────────────────────────────────

function DailyBoard({ entries }: { entries: DailyLeaderboardEntry[] }) {
  const navigate = useNavigate();
  if (entries.length === 0) {
    return <p className="font-mono text-xs text-dim text-center py-4">Be the first to finish today's puzzle!</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {entries.map((e) => (
        <button
          key={e.userId}
          onClick={() => navigate(`/profile/${e.userId}`)}
          className="flex items-center gap-3 bg-surface border border-border rounded-sm px-3 py-2
                     hover:border-border-bright active:scale-[0.99] transition-all text-left"
        >
          <span className={`font-display text-sm w-6 text-center tabular-nums shrink-0
                            ${e.rank === 1 ? "text-amber" : "text-dim"}`}>{e.rank}</span>
          <Avatar name={e.name} color={e.avatarColor} seed={e.avatar} size="sm" />
          <span className="font-mono text-xs text-text flex-1 truncate">{e.name}</span>
          <span className="font-mono text-[11px] text-muted tabular-nums shrink-0">
            {e.solved ? `${e.guesses}/6` : "X/6"}
          </span>
          <span className="font-mono text-[10px] text-dim tabular-nums shrink-0 hidden sm:inline w-12 text-right">
            {fmtTime(e.timeMs)}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DailyChallenge() {
  const navigate = useNavigate();
  const { session } = useSession();

  const [state, setState] = useState<DailyState | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [current, setCurrent] = useState("");
  const [streak, setStreak] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [entries, setEntries] = useState<DailyLeaderboardEntry[]>([]);

  const stateRef = useRef<DailyState | null>(null);
  const currentRef = useRef("");
  const submittingRef = useRef(false);
  stateRef.current = state;
  currentRef.current = current;
  submittingRef.current = submitting;

  // Guard: need a session (name/avatar) to appear on the leaderboard.
  useEffect(() => { if (!session) navigate("/", { replace: true }); }, [session, navigate]);

  // Load today's puzzle + any progress.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureToken();
        const res = await fetchDaily();
        if (cancelled) return;
        setState(res.state);
        setStreak(res.streak);
        setStatus("ready");
        if (res.state.finished) loadBoard();
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadBoard() {
    fetchDailyLeaderboard(50).then((lb) => setEntries(lb.entries)).catch(() => {});
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 1600);
  }

  const submit = useCallback(async () => {
    const st = stateRef.current;
    const guess = currentRef.current;
    if (!st || st.finished || submittingRef.current) return;
    if (guess.length !== st.wordLength) { flash("Not enough letters"); return; }

    setSubmitting(true);
    const res = await submitDailyGuess(guess);
    setSubmitting(false);

    if (!res.ok || !res.state) { flash(res.error ?? "Try again"); return; }
    setState(res.state);
    setCurrent("");
    if (res.state.finished) {
      if (typeof res.streak === "number") setStreak(res.streak);
      setRank(res.rank ?? null);
      loadBoard();
    }
  }, []);

  const onKey = useCallback((k: string) => {
    const st = stateRef.current;
    if (!st || st.finished) return;
    if (k === "enter") { submit(); return; }
    if (k === "back")  { setCurrent((c) => c.slice(0, -1)); return; }
    if (/^[a-z]$/.test(k)) {
      setCurrent((c) => (c.length < st.wordLength ? c + k : c));
    }
  }, [submit]);

  // Physical keyboard.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") onKey("enter");
      else if (e.key === "Backspace") onKey("back");
      else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key.toLowerCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onKey]);

  if (!session) return null;

  return (
    <div className="noise-bg min-h-[100dvh] flex flex-col bg-bg text-text">
      <TopBar number={state?.number ?? 0} streak={streak} onBack={() => navigate("/lobby")} />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-5">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-5 h-5 rounded-full border-2 border-border border-t-amber animate-spin" />
            <p className="font-mono text-xs text-dim">Loading today's puzzle…</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="text-3xl opacity-50">⚠️</span>
            <p className="font-mono text-sm text-muted">Couldn't load the daily challenge.</p>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        )}

        {status === "ready" && state && (
          <>
            {!state.finished && (
              <p className="font-mono text-[11px] text-muted text-center tracking-wide">
                Guess the word everyone's playing today. One try, {state.maxAttempts} guesses.
              </p>
            )}

            <div className="relative">
              <Board state={state} current={current} />
              {toast && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full
                                bg-text text-bg font-mono text-[11px] px-3 py-1.5 rounded-sm shadow-lg">
                  {toast}
                </div>
              )}
            </div>

            {!state.finished ? (
              <Keyboard states={keyStateMap(state.guesses)} onKey={onKey} disabled={submitting} />
            ) : (
              <>
                <ResultPanel state={state} streak={streak} rank={rank} />
                <section className="flex flex-col gap-3">
                  <div className="rule-label"><span className="text-text/80">Today's Leaderboard</span></div>
                  <DailyBoard entries={entries} />
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
