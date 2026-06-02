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

// ── Game preview mini-renders (used in animated background) ──────────────────

function TttPreview() {
  const cells = ['X','O','','O','X','','','','X'];
  return (
    <div className="w-full h-full bg-bg p-4 flex flex-col gap-3">
      <span className="font-mono text-[9px] text-amber/50 tracking-[3px] uppercase">Tic Tac Toe</span>
      <div className="flex-1 grid grid-cols-3 gap-1.5">
        {cells.map((c, i) => (
          <div key={i} className="bg-elevated border border-border flex items-center justify-center rounded-sm">
            {c === 'X' && <span className="font-display text-2xl text-amber">X</span>}
            {c === 'O' && <span className="font-display text-2xl text-green">O</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function C4Preview() {
  const rows = [
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,1,0,2,0,0],
    [0,1,2,1,1,0,0],
    [0,2,1,2,2,1,0],
    [2,1,2,1,2,1,2],
  ];
  return (
    <div className="w-full h-full bg-bg p-4 flex flex-col gap-3">
      <span className="font-mono text-[9px] text-amber/50 tracking-[3px] uppercase">Connect Four</span>
      <div className="flex-1 flex flex-col gap-1">
        {rows.map((row, r) => (
          <div key={r} className="flex-1 flex gap-1">
            {row.map((cell, c) => (
              <div key={c} className="flex-1 rounded-full"
                style={{ background: cell === 1 ? '#F5A623' : cell === 2 ? '#3dffa0' : '#1a1a22' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function WdlPreview() {
  type Shade = 'g' | 'y' | '_';
  const grid: { l: string; s: Shade }[][] = [
    [{l:'A',s:'g'},{l:'R',s:'y'},{l:'E',s:'_'},{l:'N',s:'_'},{l:'A',s:'_'}],
    [{l:'S',s:'_'},{l:'H',s:'g'},{l:'A',s:'y'},{l:'R',s:'_'},{l:'P',s:'_'}],
    [{l:'P',s:'g'},{l:'L',s:'g'},{l:'A',s:'g'},{l:'Y',s:'_'},{l:'S',s:'g'}],
    [{l:'',s:'_'},{l:'',s:'_'},{l:'',s:'_'},{l:'',s:'_'},{l:'',s:'_'}],
    [{l:'',s:'_'},{l:'',s:'_'},{l:'',s:'_'},{l:'',s:'_'},{l:'',s:'_'}],
  ];
  const colorMap: Record<Shade, string> = { g: '#3dffa0', y: '#F5A623', _: '#1a1a22' };
  return (
    <div className="w-full h-full bg-bg p-3 flex flex-col gap-2">
      <span className="font-mono text-[9px] text-amber/50 tracking-[3px] uppercase">Wordle Duel</span>
      <div className="flex-1 flex flex-col gap-1.5">
        {grid.map((row, r) => (
          <div key={r} className="flex-1 flex gap-1.5">
            {row.map(({ l, s }, c) => (
              <div key={c} className="flex-1 border border-border/30 flex items-center justify-center rounded-sm"
                style={{ background: colorMap[s] }}
              >
                <span className="font-display text-xs font-bold"
                  style={{ color: s !== '_' ? '#080809' : '#3a3a48' }}
                >{l}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function BombPreview() {
  return (
    <div className="w-full h-full bg-bg p-3 flex flex-col gap-3">
      <span className="font-mono text-[9px] text-amber/50 tracking-[3px] uppercase">Bomb Defusal</span>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="font-display text-5xl font-bold tracking-wider text-red">01:23</div>
        <div className="flex gap-2 w-full">
          {[['Cut A','#3dffa0'],['Cut B','#F5A623'],['Cut C','#ff4d6d'],['Cut D','#3a3a48']].map(([label, color]) => (
            <div key={label} className="flex-1 rounded-sm border border-border bg-elevated p-2">
              <span className="font-mono text-[8px] text-dim block text-center">{label}</span>
              <div className="w-full h-1 mt-1 rounded" style={{ background: color }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MemPreview() {
  const symbols = ['★','♦','●','▲','★','■','♦','●','▲','■','★','♦','●','▲','■','●'];
  const flipped = new Set([0, 3, 5, 10, 11, 14]);
  return (
    <div className="w-full h-full bg-bg p-3 flex flex-col gap-3">
      <span className="font-mono text-[9px] text-amber/50 tracking-[3px] uppercase">Memory Duel</span>
      <div className="flex-1 grid grid-cols-4 gap-1.5" style={{ gridTemplateRows: 'repeat(4, 1fr)' }}>
        {symbols.map((sym, i) => (
          <div key={i} className="flex items-center justify-center rounded-sm border"
            style={{
              background: flipped.has(i) ? '#1e1e28' : '#0d0d12',
              borderColor: flipped.has(i) ? '#2e2e38' : '#1a1a22',
            }}
          >
            {flipped.has(i) && <span className="text-sm text-amber">{sym}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TriviaPreview() {
  return (
    <div className="w-full h-full bg-bg p-3 flex flex-col gap-3">
      <span className="font-mono text-[9px] text-amber/50 tracking-[3px] uppercase">Trivia Royale</span>
      <div className="border-l-2 border-amber/30 pl-3">
        <p className="font-mono text-[9px] text-muted leading-4">Which planet is closest to the sun?</p>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-1.5">
        {[['Mercury',true],['Venus',false],['Mars',false],['Earth',false]].map(([ans, correct]) => (
          <div key={String(ans)} className="flex items-center justify-center px-2 py-1.5 rounded-sm border text-center"
            style={{
              borderColor: correct ? '#3dffa0' : '#1e1e22',
              background: correct ? 'rgba(61,255,160,0.07)' : '#0d0d12',
            }}
          >
            <span className="font-mono text-[9px]" style={{ color: correct ? '#3dffa0' : '#5a5a6a' }}>{String(ans)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Animated background – Ken Burns game panels ───────────────────────────────
const BG_PANELS = [
  { id: 'ttt',    pos: { top: '5%',    left:  '-20px' }, animClass: 'kb-p1', Comp: TttPreview    },
  { id: 'c4',     pos: { top: '4%',    right: '-20px' }, animClass: 'kb-p2', Comp: C4Preview     },
  { id: 'wdl',    pos: { top: '40%',   left:  '-20px' }, animClass: 'kb-p3', Comp: WdlPreview    },
  { id: 'trivia', pos: { top: '37%',   right: '-20px' }, animClass: 'kb-p4', Comp: TriviaPreview },
  { id: 'bomb',   pos: { bottom: '8%', left:  '-20px' }, animClass: 'kb-p5', Comp: BombPreview   },
  { id: 'mem',    pos: { bottom: '6%', right: '-20px' }, animClass: 'kb-p6', Comp: MemPreview    },
] as const;

function GameBgSlideshow() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {BG_PANELS.map(({ id, pos, animClass, Comp }) => (
        <div
          key={id}
          className="absolute w-[280px] h-[210px] overflow-hidden opacity-[0.09]"
          style={pos}
        >
          <div className={`w-full h-full ${animClass}`}>
            <Comp />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Fast random-movement particle field ──────────────────────────────────────
const PARTICLE_COLORS = ['#F5A623', '#3dffa0', '#ff4d6d', '#e8e8e8'];
const DRIFT = ['drift-a', 'drift-b', 'drift-c', 'drift-d'];

const PARTICLES = Array.from({ length: 28 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const rnd = (n: number) => ((seed * (n + 1)) % 233280) / 233280;
  return {
    id: i,
    left: `${(rnd(1) * 100).toFixed(2)}%`,
    top: `${(rnd(2) * 100).toFixed(2)}%`,
    size: 3 + Math.round(rnd(3) * 6),       // 3–9px
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    drift: DRIFT[i % DRIFT.length],
    duration: (3 + rnd(4) * 4).toFixed(2),   // 3–7s → fast
    delay: (-rnd(5) * 7).toFixed(2),
  };
});

function ParticleField() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className="particle absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            opacity: 0.5,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: `${p.drift} ${p.duration}s ${p.delay}s linear infinite`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
}

// ── Games strip – auto-scrolling marquee ticker ───────────────────────────────
const ALL_GAMES = [
  "Reaction", "Tic Tac Toe", "Hangman", "Connect Four",
  "Memory Duel", "Trivia Royale", "Wordle Duel", "Would You Rather", "Bomb Defusal",
];

function GamesStrip() {
  const items = [...ALL_GAMES, ...ALL_GAMES]; // duplicate for seamless loop
  return (
    <div className="w-full overflow-hidden slide-up-4">
      <div className="flex gap-3 w-max" style={{ animation: 'marquee 28s linear infinite' }}>
        {items.map((name, i) => (
          <div
            key={i}
            className="flex items-center gap-2 border border-border rounded-sm px-4 py-2 bg-surface/50 whitespace-nowrap"
          >
            <span className="font-display text-sm tracking-wide text-text">{name}</span>
            <Badge variant="green" dot>Live</Badge>
          </div>
        ))}
      </div>
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
      <GameBgSlideshow />
      <ParticleField />

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

        {/* ── Games strip – live ticker ── */}
        <GamesStrip />
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border py-4 px-6 flex items-center justify-between flex-wrap gap-3">
        <p className="font-mono text-[10px] text-dim tracking-widest uppercase">
          Arena · Made by <a href="https://github.com/Blaqboydee" className="text-amber hover:underline">Blaqboydee</a>
        </p>
        <a
          href="https://github.com/Blaqboydee/Arena-Frontend"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 border border-border rounded-sm px-3 py-1.5 bg-surface/50 hover:border-amber/40 hover:bg-elevated transition-colors duration-150 group"
        >
          {/* GitHub star icon */}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted group-hover:text-amber transition-colors duration-150">
            <path d="M8 .25a7.75 7.75 0 0 0-2.45 15.1c.39.07.53-.17.53-.37v-1.32c-2.15.47-2.6-1.04-2.6-1.04-.35-.9-.86-1.13-.86-1.13-.7-.48.05-.47.05-.47.78.05 1.19.8 1.19.8.69 1.18 1.81.84 2.25.64.07-.5.27-.84.49-1.03-1.72-.2-3.52-.86-3.52-3.83 0-.85.3-1.54.8-2.08-.08-.2-.35-1 .08-2.07 0 0 .65-.21 2.13.8A7.4 7.4 0 0 1 8 3.97c.66 0 1.32.09 1.94.27 1.48-1.01 2.13-.8 2.13-.8.43 1.07.16 1.87.08 2.07.5.54.8 1.23.8 2.08 0 2.98-1.81 3.63-3.53 3.82.28.24.52.71.52 1.43v2.12c0 .2.14.45.54.37A7.75 7.75 0 0 0 8 .25Z" fill="currentColor"/>
          </svg>
          <span className="font-mono text-[10px] text-muted group-hover:text-text tracking-widest uppercase transition-colors duration-150">Star on GitHub</span>
          {/* Star symbol */}
          <span className="font-mono text-[10px] text-dim group-hover:text-amber transition-colors duration-150">★</span>
        </a>
      </footer>
    </div>
  );
}