import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSummary, fetchLeaderboard, type LeaderboardPlayer, type Summary } from "../lib/api";
import Avatar from "./ui/Avatar";

// A compact, live "who's on top" strip for the landing page — social proof plus
// a reason to climb. Hides itself until stats load; links to the full board.
export default function LeaderboardTeaser() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [top, setTop] = useState<LeaderboardPlayer | null>(null);

  useEffect(() => {
    fetchSummary().then(setSummary).catch(() => {});
    fetchLeaderboard("all", 1).then((d) => setTop(d.players[0] ?? null)).catch(() => {});
  }, []);

  if (!summary) return null;

  return (
    <button
      onClick={() => navigate("/leaderboard")}
      className="group flex items-center gap-3 bg-surface/60 border border-border rounded-sm px-4 py-2.5 hover:border-amber/40 transition-all duration-150 slide-up-4 max-w-md w-full"
    >
      {top ? (
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-amber leading-none">👑</span>
          <Avatar name={top.displayName} color={top.avatarColor} seed={top.avatar} size="sm" />
          <span className="font-display text-sm truncate text-text max-w-[90px]">{top.displayName}</span>
          <span className="font-mono text-[11px] text-amber tabular-nums shrink-0">{top.rating}</span>
        </div>
      ) : (
        <span className="font-mono text-[11px] text-muted">No champions yet — be the first</span>
      )}

      <span className="w-px h-4 bg-border shrink-0 hidden xs:block" />
      <span className="font-mono text-[10px] text-dim tracking-widest uppercase hidden xs:block">
        {summary.totalPlayers} players · {summary.totalMatches} games
      </span>

      <span className="font-mono text-[10px] text-amber tracking-widest uppercase ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform">
        Ranks →
      </span>
    </button>
  );
}
