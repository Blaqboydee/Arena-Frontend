import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProfile, type Profile as ProfileData, type MatchResult } from "../lib/api";
import { GAME_META, timeAgo } from "../lib/games";
import { getUserId } from "../socket";
import Avatar from "../components/ui/Avatar";

const RESULT_STYLE: Record<MatchResult, { label: string; cls: string }> = {
  win:     { label: "WON",      cls: "text-green border-green/40 bg-green/10" },
  loss:    { label: "LOST",     cls: "text-red border-red/40 bg-red/10" },
  draw:    { label: "DRAW",     cls: "text-muted border-border bg-elevated" },
  forfeit: { label: "FORFEIT",  cls: "text-red border-red/30 bg-red/5" },
};

function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-mono text-[11px] text-dim tracking-widest uppercase hover:text-muted active:scale-95 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <span className="font-display text-xl tracking-arena text-text">ARENA</span>
      </div>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 bg-surface border border-border rounded-sm py-4">
      <span className={`font-display text-3xl sm:text-4xl font-bold tabular-nums leading-none ${accent ?? "text-text"}`}>{value}</span>
      <span className="font-mono text-[9px] text-dim tracking-widest uppercase">{label}</span>
    </div>
  );
}

// Thin win-rate meter
function WinBar({ wins, losses, draws }: { wins: number; losses: number; draws: number }) {
  const total = Math.max(1, wins + losses + draws);
  const seg = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-elevated">
      <div className="bg-green" style={{ width: seg(wins) }} />
      <div className="bg-muted/50" style={{ width: seg(draws) }} />
      <div className="bg-red" style={{ width: seg(losses) }} />
    </div>
  );
}

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const isMe = id === getUserId();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetchProfile(id)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) { setNotFound(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className="noise-bg min-h-screen bg-bg text-text flex flex-col">
      <TopBar onBack={() => navigate(-1)} />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="h-28 rounded-sm bg-surface border border-border animate-pulse" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-sm bg-surface border border-border animate-pulse" />)}
            </div>
          </div>
        ) : notFound || !data ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <span className="text-4xl opacity-40">🚫</span>
            <p className="font-mono text-sm text-muted">Player not found.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 slide-up-1">
              <Avatar name={data.user.displayName} color={data.user.avatarColor} seed={data.user.avatar} size="xl" />
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display font-800 text-3xl sm:text-4xl tracking-wide leading-none truncate">{data.user.displayName}</h1>
                  {isMe && <span className="font-mono text-[8px] text-amber border border-amber/40 rounded-sm px-1 py-0.5 tracking-widest">YOU</span>}
                </div>
                <span className="font-mono text-[11px] text-dim tracking-widest uppercase">
                  {data.user.isGuest ? "Guest" : "Member"} · joined {timeAgo(data.user.createdAt)}
                </span>
              </div>
            </div>

            {/* Lifetime stat tiles */}
            <div className="grid grid-cols-4 gap-2 slide-up-2">
              <StatTile label="Games"  value={data.user.gamesPlayed} />
              <StatTile label="Wins"   value={data.user.wins}   accent="text-green" />
              <StatTile label="Losses" value={data.user.losses} accent="text-red" />
              <StatTile label="Win %"  value={`${data.user.winRate}`} accent="text-amber" />
            </div>

            {/* Per-game breakdown */}
            <section className="flex flex-col gap-3 slide-up-3">
              <div className="rule-label"><span>By Game</span></div>
              {data.gameStats.length === 0 ? (
                <p className="font-mono text-xs text-dim py-4">No games played yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.gameStats.map((g) => (
                    <div key={g.gameType} className="bg-surface border border-border rounded-sm px-4 py-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base">{GAME_META[g.gameType]?.icon ?? "🎮"}</span>
                          <span className="font-display text-base truncate">{GAME_META[g.gameType]?.label ?? g.gameType}</span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs tabular-nums">
                          <span className="text-green">{g.wins}W</span>
                          <span className="text-red">{g.losses}L</span>
                          <span className="text-muted">{g.draws}D</span>
                          <span className="text-amber w-9 text-right">{g.winRate}%</span>
                        </div>
                      </div>
                      <WinBar wins={g.wins} losses={g.losses} draws={g.draws} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent matches */}
            <section className="flex flex-col gap-3 slide-up-4">
              <div className="rule-label"><span>Recent Matches</span></div>
              {data.recentMatches.length === 0 ? (
                <p className="font-mono text-xs text-dim py-4">No matches yet.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {data.recentMatches.map((m, i) => {
                    const rs = RESULT_STYLE[m.result] ?? RESULT_STYLE.draw;
                    return (
                      <div key={i} className="flex items-center gap-3 bg-surface border border-border rounded-sm px-4 py-2.5">
                        <span className="text-base shrink-0">{GAME_META[m.gameType]?.icon ?? "🎮"}</span>
                        <span className="font-display text-sm flex-1 truncate">{GAME_META[m.gameType]?.label ?? m.gameType}</span>
                        <span className="font-mono text-[10px] text-dim hidden sm:block">{timeAgo(m.endedAt)}</span>
                        <span className={`font-mono text-[9px] tracking-widest border rounded-sm px-1.5 py-0.5 shrink-0 ${rs.cls}`}>{rs.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
