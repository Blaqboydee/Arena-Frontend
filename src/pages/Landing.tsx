import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AvatarColor } from "../types";
import { useSession } from "../hooks/useSession";
import Button from "../components/ui/Button";
import Avatar from "../components/ui/Avatar";
import ColorPicker from "../components/ui/ColorPicker";
import Badge from "../components/ui/Badge";

// ── Decorative background grid lines ─────────────────────────────────────────
function GridLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Horizontal lines */}
      {[20, 40, 60, 80].map((pct) => (
        <div
          key={pct}
          className="absolute w-full h-px bg-border/60"
          style={{ top: `${pct}%` }}
        />
      ))}
      {/* Vertical lines */}
      {[20, 40, 60, 80].map((pct) => (
        <div
          key={pct}
          className="absolute h-full w-px bg-border/40"
          style={{ left: `${pct}%` }}
        />
      ))}
      {/* Radial center glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(245,166,35,0.04)_0%,transparent_70%)]" />
    </div>
  );
}

// ── Stat ticker ───────────────────────────────────────────────────────────────
// function StatBar() {
//   const stats = [
//     { label: "Players Online", value: "—" },
//     { label: "Games Today",    value: "—" },
//     { label: "Active Rooms",   value: "—" },
//   ];

//   return (
//     <div className="w-full border-b border-border bg-surface/60 backdrop-blur-sm">
//       <div className="max-w-5xl mx-auto px-6 py-2 flex items-center justify-between">
//         {/* Left — wordmark */}
//         <span className="font-display text-sm tracking-arena text-muted uppercase">
//           Arena
//         </span>

//         {/* Right — stats */}
//         <div className="flex items-center gap-6">
//           {stats.map((s) => (
//             <div key={s.label} className="flex items-center gap-2">
//               <span className="text-[10px] text-dim font-mono tracking-widest uppercase">
//                 {s.label}
//               </span>
//               <span className="font-display text-sm text-amber tracking-wide">
//                 {s.value}
//               </span>
//             </div>
//           ))}
//           <Badge variant="green" dot>Live</Badge>
//         </div>
//       </div>
//     </div>
//   );
// }

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const { setSession } = useSession();

  const [name, setName] = useState("");
  const [color, setColor] = useState<AvatarColor>("amber");
  const [error, setError] = useState("");

  function handleEnter() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("You need a name to enter the arena.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setSession({ name: trimmed, avatarColor: color });
    navigate("/lobby");
  }

  return (
    <div className="noise-bg min-h-screen flex flex-col bg-bg relative overflow-hidden">
      <GridLines />

      {/* ── Top stat bar ── */}
      <div className="relative z-10">
        {/* <StatBar /> */}
      </div>

      {/* ── Hero ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 gap-12">

        {/* Platform title */}
        <div className="flex flex-col items-center gap-3 slide-up-1">
          {/* Overline */}
          <div className="rule-label w-64">
            <span>Multiplayer Games</span>
          </div>

          {/* Main logo */}
          <div className="relative scanlines">
            <h1 className="font-display font-800 text-[clamp(5rem,18vw,14rem)] tracking-arena text-text leading-none flicker select-none">
              ARENA
            </h1>
            {/* Amber underline bar */}
            <div className="absolute -bottom-2 left-0 right-0 h-[3px] bg-amber" />
          </div>

          {/* Tagline */}
          <p className="font-mono text-sm text-muted tracking-widest mt-4">
            1v1 · No signup · No mercy
          </p>
        </div>

        {/* ── Entry card ── */}
        <div className="bracket-card bg-surface border border-border rounded-sm p-8 w-full max-w-md flex flex-col gap-6 slide-up-3">

          {/* Section label */}
          <div className="rule-label">
            <span>Identify yourself</span>
          </div>

          {/* Avatar preview + name input */}
          <div className="flex items-center gap-4">
            <Avatar name={name || "?"} color={color} size="xl" />

            <div className="flex-1 flex flex-col gap-1">
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleEnter()}
                maxLength={20}
                placeholder="Enter callsign…"
                autoFocus
                className="
                  w-full bg-bg border border-border rounded-sm
                  px-4 py-3 font-mono text-base text-text
                  placeholder-dim outline-none
                  focus:border-amber/60 transition-colors duration-150
                "
              />
              {error && (
                <p className="text-[11px] text-red font-mono">{error}</p>
              )}
            </div>
          </div>

          {/* Color picker */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] text-dim tracking-widest uppercase">
              Arena color
            </span>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          {/* CTA */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleEnter}
            className="mt-2 amber-pulse"
          >
            Enter Arena →
          </Button>
        </div>

        {/* ── Games preview strip ── */}
        <div className="flex items-center gap-4 slide-up-4 flex-wrap justify-center">
          {[
            { name: "Reaction",  status: "live"    },
            { name: "Tic Tac Toe", status: "live"  },
            { name: "Hangman",   status: "soon"    },
          ].map((g) => (
            <div
              key={g.name}
              className="flex items-center gap-2 border border-border rounded-sm px-4 py-2 bg-surface/50"
            >
              <span className="font-display text-sm tracking-wide text-text">
                {g.name}
              </span>
              {g.status === "live" ? (
                <Badge variant="green" dot>Live</Badge>
              ) : (
                <Badge variant="dim">Soon</Badge>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border py-4 px-6">
        <p className="text-center font-mono text-[10px] text-dim tracking-widest uppercase">
          Arena · Made by <a href="https://github.com/Blaqboydee" className="text-amber hover:underline">Blaqboydee</a>
        </p>
      </footer>
    </div>
  );
}