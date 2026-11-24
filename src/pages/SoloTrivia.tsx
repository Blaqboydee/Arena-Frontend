import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import socket, { getGuestToken } from "../socket";
import { fetchTriviaPacks, type TriviaPack } from "../lib/api";
import {
  startSoloTrivia, answerSoloTrivia,
  type SoloQuestion, type SoloSummary, type SoloLeaderboardEntry,
} from "../lib/soloApi";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;
const REVEAL_MS = 1500;

// Ensure a guest token exists (mint via the socket on a cold start).
function ensureToken(): Promise<void> {
  if (getGuestToken()) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    socket.once("identity", done);
    socket.connect();
    setTimeout(done, 8000);
  });
}

type Status = "pick" | "loading" | "playing" | "reveal" | "done" | "error";

// ── Top bar ───────────────────────────────────────────────────────────────────

function TopBar({ onBack, score }: { onBack: () => void; score: number | null }) {
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
        <span className="font-display text-lg tracking-arena text-text">SOLO TRIVIA</span>
        <span className="font-display text-base text-amber tabular-nums min-w-[52px] text-right">
          {score != null ? score.toLocaleString() : ""}
        </span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SoloTrivia() {
  const navigate = useNavigate();
  const { session } = useSession();

  const [status, setStatus] = useState<Status>("pick");
  const [packs, setPacks] = useState<TriviaPack[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState<SoloQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [lastPoints, setLastPoints] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [summary, setSummary] = useState<SoloSummary | null>(null);
  const [entries, setEntries] = useState<SoloLeaderboardEntry[]>([]);
  const [toast, setToast] = useState("");
  const [lastPack, setLastPack] = useState("random");

  const timerRef = useRef<number | null>(null);
  const answeringRef = useRef(false);

  // Guard: need a session (name/avatar) to appear on the leaderboard.
  useEffect(() => { if (!session) navigate("/", { replace: true }); }, [session, navigate]);

  useEffect(() => {
    let cancelled = false;
    ensureToken().then(() => fetchTriviaPacks())
      .then((res) => { if (!cancelled) setPacks(res.packs); })
      .catch(() => { /* picker still offers Mixed */ });
    return () => { cancelled = true; };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  function startTimer(ms: number) {
    clearTimer();
    setTimeLeft(ms);
    const end = Date.now() + ms;
    timerRef.current = window.setInterval(() => {
      const left = end - Date.now();
      if (left <= 0) { clearTimer(); submitAnswer(-1); }
      else setTimeLeft(left);
    }, 100);
  }

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(""), 1800); }

  async function begin(pack: string) {
    setStatus("loading");
    setLastPack(pack);
    setScore(0);
    const res = await startSoloTrivia(pack);
    if (!res.ok || !res.question || !res.sessionId) {
      flash(res.error ?? "Could not start."); setStatus("pick"); return;
    }
    setSessionId(res.sessionId);
    setQuestion(res.question);
    setSelected(null);
    setCorrectIndex(null);
    setStatus("playing");
    startTimer(res.question.timeLimit);
  }

  const submitAnswer = useCallback(async (choice: number) => {
    if (answeringRef.current) return;
    answeringRef.current = true;
    clearTimer();
    setSelected(choice);

    const res = await answerSoloTrivia(sessionId, choice);
    answeringRef.current = false;

    if (!res.ok) { flash(res.error ?? "Try again"); setStatus("pick"); return; }

    setCorrectIndex(res.correctIndex ?? null);
    setLastPoints(res.points ?? 0);
    if (typeof res.score === "number") setScore(res.score);
    setStatus("reveal");

    setTimeout(() => {
      if (res.finished) {
        setSummary(res.summary ?? null);
        setEntries(res.leaderboard ?? []);
        setStatus("done");
      } else if (res.next) {
        setQuestion(res.next);
        setSelected(null);
        setCorrectIndex(null);
        setStatus("playing");
        startTimer(res.next.timeLimit);
      }
    }, REVEAL_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, clearTimer]);

  if (!session) return null;

  const showingQuestion = (status === "playing" || status === "reveal") && question;

  return (
    <div className="noise-bg min-h-[100dvh] flex flex-col bg-bg text-text">
      <TopBar onBack={() => navigate("/lobby")} score={showingQuestion || status === "done" ? score : null} />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-5">

        {/* ── Pack picker ── */}
        {status === "pick" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-1 text-center pt-4">
              <span className="text-4xl">🧠</span>
              <h1 className="font-display text-3xl tracking-wide">Solo Trivia</h1>
              <p className="font-mono text-[11px] text-muted">
                10 questions. Faster correct answers score more. Beat the board.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <PackButton icon="🎲" label="Mixed" sub="All packs" onClick={() => begin("random")} />
              {packs.map((p) => (
                <PackButton key={p.id} icon={p.icon} label={p.label} sub={`${p.count} questions`} onClick={() => begin(p.id)} />
              ))}
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-24">
            <div className="w-5 h-5 rounded-full border-2 border-border border-t-amber animate-spin" />
            <p className="font-mono text-xs text-dim">Loading questions…</p>
          </div>
        )}

        {/* ── Question ── */}
        {showingQuestion && (
          <div className="flex flex-col gap-4">
            {/* Progress + timer */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between font-mono text-[11px] text-dim tracking-widest uppercase">
                <span>Question {question!.index + 1} / {question!.total}</span>
                <span>{Math.ceil(timeLeft / 1000)}s</span>
              </div>
              <div className="h-1 w-full rounded-full bg-elevated overflow-hidden">
                <div
                  className="h-full bg-amber transition-[width] duration-100 ease-linear"
                  style={{ width: `${status === "reveal" ? 0 : (timeLeft / question!.timeLimit) * 100}%` }}
                />
              </div>
            </div>

            {/* Prompt */}
            <div className="bracket-card bg-surface border border-border rounded-sm p-5 min-h-[88px] flex items-center">
              <p className="font-display text-xl sm:text-2xl leading-snug text-text">{question!.q}</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-2">
              {question!.options.map((opt, i) => {
                const isCorrect = status === "reveal" && correctIndex === i;
                const isWrongPick = status === "reveal" && selected === i && correctIndex !== i;
                const cls = isCorrect
                  ? "border-green/60 bg-green/15 text-text"
                  : isWrongPick
                    ? "border-red/60 bg-red/10 text-text"
                    : status === "reveal"
                      ? "border-border bg-surface text-muted opacity-60"
                      : "border-border bg-surface text-text hover:border-amber/50 hover:bg-elevated";
                return (
                  <button
                    key={i}
                    disabled={status === "reveal"}
                    onClick={() => submitAnswer(i)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-sm border text-left transition-all active:scale-[0.99] ${cls}`}
                  >
                    <span className={`font-display text-sm w-5 shrink-0 ${isCorrect ? "text-green" : isWrongPick ? "text-red" : "text-dim"}`}>
                      {OPTION_LABELS[i]}
                    </span>
                    <span className="font-mono text-sm flex-1">{opt}</span>
                    {isCorrect && <span className="text-green shrink-0">✓</span>}
                    {isWrongPick && <span className="text-red shrink-0">✕</span>}
                  </button>
                );
              })}
            </div>

            {status === "reveal" && (
              <p className={`font-mono text-xs text-center ${lastPoints > 0 ? "text-green" : "text-dim"}`}>
                {lastPoints > 0 ? `+${lastPoints}` : selected === -1 ? "Time's up" : "No points"}
              </p>
            )}
          </div>
        )}

        {/* ── Done ── */}
        {status === "done" && summary && (
          <div className="flex flex-col gap-5">
            <div className="bracket-card bg-surface border border-border rounded-sm p-5 flex flex-col gap-4 slide-up-1">
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-3xl">{summary.isNewBest ? "🏆" : "✅"}</span>
                <h2 className="font-display text-2xl tracking-wide">
                  {summary.correct}/{summary.total} correct
                </h2>
                <p className="font-display text-3xl text-amber tabular-nums">{summary.score.toLocaleString()}</p>
                {summary.isNewBest && (
                  <span className="font-mono text-[10px] text-amber border border-amber/40 rounded-sm px-2 py-0.5 tracking-widest uppercase mt-1">
                    New personal best
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Your best" value={summary.best.toLocaleString()} />
                <Stat label="Rank" value={summary.rank ? `#${summary.rank}` : "—"} accent="text-amber" />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" fullWidth onClick={() => begin(lastPack)}>Play again</Button>
                <Button variant="ghost" size="sm" fullWidth onClick={() => setStatus("pick")}>Change pack</Button>
              </div>
            </div>

            <section className="flex flex-col gap-3">
              <div className="rule-label"><span className="text-text/80">High Scores</span></div>
              {entries.length === 0 ? (
                <p className="font-mono text-xs text-dim text-center py-3">Be the first on the board!</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {entries.map((e) => (
                    <button
                      key={e.userId}
                      onClick={() => navigate(`/profile/${e.userId}`)}
                      className="flex items-center gap-3 bg-surface border border-border rounded-sm px-3 py-2 hover:border-border-bright active:scale-[0.99] transition-all text-left"
                    >
                      <span className={`font-display text-sm w-6 text-center tabular-nums shrink-0 ${e.rank === 1 ? "text-amber" : "text-dim"}`}>{e.rank}</span>
                      <Avatar name={e.name} color={e.avatarColor} seed={e.avatar} size="sm" />
                      <span className="font-mono text-xs text-text flex-1 truncate">{e.name}</span>
                      <span className="font-mono text-[11px] text-amber tabular-nums shrink-0">{e.score.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-text text-bg font-mono text-[11px] px-3 py-1.5 rounded-sm shadow-lg z-50">
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Bits ──────────────────────────────────────────────────────────────────────

function PackButton({ icon, label, sub, onClick }: { icon: string; label: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-sm border border-border bg-surface
                 hover:border-amber/50 hover:bg-elevated active:scale-[0.99] transition-all text-left"
    >
      <span className="text-xl shrink-0">{icon}</span>
      <span className="font-display text-base text-text flex-1">{label}</span>
      <span className="font-mono text-[10px] text-dim">{sub}</span>
      <span className="font-mono text-[11px] text-amber uppercase tracking-widest">Play →</span>
    </button>
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
