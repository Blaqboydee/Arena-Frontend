import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLeaderboard, type LeaderboardPlayer } from "../lib/api";
import { GAME_META, GAME_ORDER } from "../lib/games";
import { getUserId } from "../socket";
import { tierForRating } from "../lib/tiers";
import type { GameType } from "../types";
import Avatar from "../components/ui/Avatar";

const RANK_COLOR: Record<number, string> = {
  1: "text-amber",
  2: "text-[#c8ccd4]",
  3: "text-[#cd7f4d]",
};

// ── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-mono text-[11px] text-dim tracking-widest uppercase hover:text-muted active:scale-95 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Lobby
        </button>
        <span className="font-display text-xl tracking-arena text-text">ARENA</span>
      </div>
    </div>
  );
}

// ── Player row ────────────────────────────────────────────────────────────────
function PlayerRow({ p, isMe, onClick, style }: { p: LeaderboardPlayer; isMe: boolean; onClick: () => void; style?: CSSProperties }) {
  const tier = tierForRating(p.rating);
  return (
    <button
      onClick={onClick}
      style={style}
      className={`group flex items-center gap-3 sm:gap-4 w-full text-left rounded-sm px-3 sm:px-4 py-3 border transition-all duration-150 active:scale-[0.99]
        ${isMe ? "bg-amber/5 border-amber/40" : "bg-surface border-border hover:border-amber/30 hover:bg-elevated"}`}
    >
      <div className={`w-7 text-center font-display text-2xl font-bold tabular-nums shrink-0 ${RANK_COLOR[p.rank] ?? "text-dim"}`}>
        {p.rank}
      </div>

      <Avatar name={p.displayName} color={p.avatarColor} seed={p.avatar} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg leading-tight truncate text-text">{p.displayName}</span>
          {isMe && (
            <span className="font-mono text-[8px] text-amber border border-amber/40 rounded-sm px-1 py-0.5 tracking-widest shrink-0">YOU</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tier.color }} />
          <span style={{ color: tier.color }}>{tier.name}</span>
          <span className="text-dim truncate">· {p.winRate}% · {p.wins}-{p.losses}</span>
        </div>
      </div>

      <div className="flex flex-col items-end shrink-0">
        <span className="font-display text-xl font-bold tabular-nums text-amber leading-none">{p.rating}</span>
        <span className="font-mono text-[8px] text-dim tracking-widest mt-0.5">ELO</span>
      </div>
    </button>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[62px] rounded-sm bg-surface border border-border animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <span className="text-4xl opacity-40">🏆</span>
      <p className="font-mono text-sm text-muted max-w-xs">{text}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Leaderboard() {
  const navigate = useNavigate();
  const [game, setGame] = useState<"all" | GameType>("all");
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const myId = getUserId();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchLeaderboard(game, 50)
      .then((d) => { if (!cancelled) { setPlayers(d.players); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [game]);

  const tabs: ("all" | GameType)[] = ["all", ...GAME_ORDER];

  return (
    <div className="noise-bg min-h-screen bg-bg text-text flex flex-col">
      <TopBar onBack={() => navigate("/lobby")} />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Title */}
        <div className="flex flex-col gap-3 slide-up-1">
          <div className="rule-label"><span>Rankings</span></div>
          <h1 className="font-display font-800 text-5xl sm:text-6xl tracking-arena leading-none select-none">
            LEADERBOARD
          </h1>
        </div>

        {/* Game filter */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {tabs.map((t) => {
            const active = t === game;
            const label = t === "all" ? "All Games" : GAME_META[t].label;
            const icon = t === "all" ? "★" : GAME_META[t].icon;
            return (
              <button
                key={t}
                onClick={() => setGame(t)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-sm border font-mono text-[11px] tracking-widest uppercase transition-all duration-150 active:scale-95
                  ${active ? "bg-amber/15 border-amber/50 text-amber" : "bg-surface border-border text-muted hover:border-border-bright hover:text-text"}`}
              >
                <span className="text-xs">{icon}</span>
                {label}
              </button>
            );
          })}
        </div>

        {/* Board */}
        {loading ? (
          <Skeleton />
        ) : error ? (
          <EmptyState text="Couldn't load the leaderboard. Check your connection and try again." />
        ) : players.length === 0 ? (
          <EmptyState text="No matches here yet. Play a game and claim the top spot!" />
        ) : (
          <div className="flex flex-col gap-1.5">
            {players.map((p, i) => (
              <PlayerRow
                key={p.id}
                p={p}
                isMe={p.id === myId}
                onClick={() => navigate(`/profile/${p.id}`)}
                style={{ animation: "slide-up 0.4s ease both", animationDelay: `${Math.min(i, 15) * 35}ms` }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
