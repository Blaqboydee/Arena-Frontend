import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDaily, type DailyState } from "../lib/dailyApi";

// Lobby banner for the Daily Challenge: shows the player's streak and today's
// status, and routes to /daily. Fetches best-effort — never blocks the lobby.
export default function DailyChallengeCard() {
  const navigate = useNavigate();
  const [state, setState] = useState<DailyState | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchDaily()
      .then((res) => { if (!cancelled) { setState(res.state); setStreak(res.streak); } })
      .catch(() => { /* leave defaults — card still invites play */ });
    return () => { cancelled = true; };
  }, []);

  const finished   = state?.finished ?? false;
  const inProgress = !finished && (state?.attempts ?? 0) > 0;
  const number     = state?.number ?? 0;

  const cta = finished ? "View result" : inProgress ? "Continue →" : "Play →";
  const statusLine = finished
    ? (state?.solved ? `Solved ${state?.attempts}/6 today` : "Done for today")
    : inProgress
      ? `In progress · ${state?.attempts}/6`
      : "Fresh word. One try. Everyone plays the same puzzle.";

  return (
    <button
      onClick={() => navigate("/daily")}
      className="w-full max-w-4xl slide-up-2 group text-left
                 bracket-card bg-surface border border-amber/40 rounded-sm
                 px-5 py-4 flex items-center gap-4
                 hover:border-amber/70 hover:bg-amber/5 active:scale-[0.995] transition-all"
    >
      <span className="text-3xl shrink-0">🧩</span>

      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display text-xl tracking-wide text-text">Daily Challenge</span>
          {number > 0 && <span className="font-mono text-[10px] text-dim tabular-nums">#{number}</span>}
          {!finished && (
            <span className="font-mono text-[9px] text-amber border border-amber/40 rounded-sm px-1.5 py-0.5 tracking-widest uppercase">
              {inProgress ? "Resume" : "New"}
            </span>
          )}
        </div>
        <span className="font-mono text-[11px] text-muted truncate">{statusLine}</span>
      </div>

      {/* Streak */}
      <div className="flex flex-col items-center shrink-0 px-2" title="Daily streak">
        <span className="font-display text-xl text-amber tabular-nums leading-none">
          {streak}
        </span>
        <span className="font-mono text-[9px] text-dim tracking-widest uppercase">🔥 streak</span>
      </div>

      <span className="font-mono text-[11px] text-amber uppercase tracking-widest shrink-0 group-hover:translate-x-0.5 transition-transform">
        {cta}
      </span>
    </button>
  );
}
