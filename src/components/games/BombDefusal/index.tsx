import { useNavigate } from "react-router-dom";
import type { Player } from "../../../types";
import { useBombDefusal } from "../../../hooks/useBombDefusal";
import type { WireModuleView, KeypadModuleView, SimonModuleView, ModuleView } from "../../../hooks/useBombDefusal";
import BombResultScreen from "./BombResultScreen";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

// ── Timer bar ─────────────────────────────────────────────────────────────────

function TimerBar({ pct, strikeFlash }: { pct: number; strikeFlash: boolean }) {
  const color = pct > 50 ? "bg-green" : pct > 25 ? "bg-amber" : "bg-red";
  return (
    <div className={`w-full h-2 bg-border rounded-full overflow-hidden transition-all ${
      strikeFlash ? "ring-2 ring-red" : ""
    }`}>
      <div
        className={`h-full rounded-full transition-[width] duration-100 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Strike indicator ──────────────────────────────────────────────────────────

function StrikeDisplay({ strikes, max, flash }: { strikes: number; max: number; flash: boolean }) {
  return (
    <div className={`flex items-center gap-2 transition-transform ${flash ? "scale-110" : ""}`}>
      <span className="font-mono text-xs text-dim">STRIKES:</span>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`text-lg ${i < strikes ? "text-red" : "text-border"}`}
        >
          ✕
        </span>
      ))}
    </div>
  );
}

// ── Wire Module (Defuser view) ────────────────────────────────────────────────

function WireModuleDefuser({
  mod,
  onCut,
}: {
  mod:   WireModuleView;
  onCut: (idx: number) => void;
}) {
  if (mod.solved) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="font-display text-2xl text-green">✓ Solved</span>
      </div>
    );
  }

  const wireColors: Record<string, string> = {
    red:    "bg-red",
    blue:   "bg-blue",
    yellow: "bg-amber",
    white:  "bg-white",
    black:  "bg-zinc-800",
    green:  "bg-green",
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-sm text-dim uppercase tracking-wider">
        Wires — Cut the correct one
      </h3>
      <div className="flex flex-col gap-2">
        {mod.wires?.map((color, i) => (
          <button
            key={i}
            onClick={() => onCut(i)}
            className="group flex items-center gap-3 px-3 py-2 rounded-sm border border-border bg-surface
                       hover:border-red/50 hover:bg-red/5 cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className={`w-8 h-3 rounded-full ${wireColors[color] ?? "bg-zinc-500"}`} />
            <span className="font-mono text-xs text-dim">
              Wire {i + 1} — {color}
            </span>
            <span className="ml-auto text-red opacity-0 group-hover:opacity-100 transition-opacity font-mono text-xs">
              CUT
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Wire Module (Expert view) ─────────────────────────────────────────────────

function WireModuleExpert({ mod }: { mod: WireModuleView }) {
  if (mod.solved) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="font-display text-2xl text-green">✓ Solved</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-sm text-dim uppercase tracking-wider">
        Wire Manual — {mod.wireCount} wires
      </h3>
      <ol className="list-decimal list-inside text-xs text-muted space-y-1.5 font-mono">
        {mod.rules?.map((rule, i) => (
          <li key={i}>{rule}</li>
        ))}
      </ol>
    </div>
  );
}

// ── Keypad Module (Defuser view) ──────────────────────────────────────────────

function KeypadModuleDefuser({
  mod,
  onPress,
}: {
  mod:     KeypadModuleView;
  onPress: (sym: string) => void;
}) {
  if (mod.solved) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="font-display text-2xl text-green">✓ Solved</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-sm text-dim uppercase tracking-wider">
        Keypad — Press in the correct order
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {mod.symbols?.map((sym, i) => {
          const alreadyPressed = mod.pressed?.includes(sym);
          return (
            <button
              key={i}
              onClick={() => !alreadyPressed && onPress(sym)}
              disabled={alreadyPressed}
              className={`text-2xl p-4 rounded-sm border transition-all ${
                alreadyPressed
                  ? "bg-green/10 border-green/30 text-green"
                  : "bg-surface border-border text-muted hover:bg-amber/10 hover:border-amber/40 cursor-pointer active:scale-95"
              }`}
            >
              {sym}
            </button>
          );
        })}
      </div>
      {(mod.pressed?.length ?? 0) > 0 && (
        <p className="text-xs text-dim font-mono">
          Pressed: {mod.pressed?.join(" → ")}
        </p>
      )}
    </div>
  );
}

// ── Keypad Module (Expert view) ───────────────────────────────────────────────

function KeypadModuleExpert({ mod }: { mod: KeypadModuleView }) {
  if (mod.solved) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="font-display text-2xl text-green">✓ Solved</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-sm text-dim uppercase tracking-wider">
        Keypad Manual — Find the matching column
      </h3>
      <p className="text-xs text-dim font-mono">
        Find the column containing all symbols the defuser sees. Press them top-to-bottom in column order.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {mod.columns?.map((col, i) => (
          <div key={i} className="flex flex-col gap-1 p-2 rounded-sm border border-border bg-surface">
            <span className="font-display text-xs text-dim mb-1">Col {i + 1}</span>
            {col.map((sym, j) => (
              <span key={j} className="text-lg text-center">{sym}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Simon Says Module (Defuser view) ──────────────────────────────────────────

const SIMON_BUTTON_STYLES: Record<string, { bg: string; active: string; text: string }> = {
  red:    { bg: "bg-red/20",    active: "bg-red/40",    text: "text-red" },
  blue:   { bg: "bg-blue/20",   active: "bg-blue/40",   text: "text-blue" },
  green:  { bg: "bg-green/20",  active: "bg-green/40",  text: "text-green" },
  yellow: { bg: "bg-amber/20",  active: "bg-amber/40",  text: "text-amber" },
};

function SimonModuleDefuser({
  mod,
  onPress,
}: {
  mod:     SimonModuleView;
  onPress: (color: string) => void;
}) {
  if (mod.solved) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="font-display text-2xl text-green">✓ Solved</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-sm text-dim uppercase tracking-wider">
        Simon Says — Repeat the mapped sequence
      </h3>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-dim font-mono">
          Flashing: {mod.sequence?.map((c, i) => (
            <span key={i} className={SIMON_BUTTON_STYLES[c]?.text ?? "text-muted"}>
              {c}{i < (mod.sequence?.length ?? 0) - 1 ? " → " : ""}
            </span>
          ))}
        </p>
        {(mod.inputSoFar?.length ?? 0) > 0 && (
          <p className="text-xs text-dim font-mono">
            Your input: {mod.inputSoFar?.join(" → ")}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {["red", "blue", "green", "yellow"].map((color) => {
          const s = SIMON_BUTTON_STYLES[color];
          return (
            <button
              key={color}
              onClick={() => onPress(color)}
              className={`p-4 rounded-sm border border-border ${s.bg} ${s.text}
                         font-display text-sm uppercase tracking-wider
                         hover:${s.active} cursor-pointer transition-all active:scale-95`}
            >
              {color}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Simon Says Module (Expert view) ───────────────────────────────────────────

function SimonModuleExpert({ mod }: { mod: SimonModuleView }) {
  if (mod.solved) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="font-display text-2xl text-green">✓ Solved</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-sm text-dim uppercase tracking-wider">
        Simon Manual — Color Mapping (Strikes: {mod.strikeCount ?? 0})
      </h3>
      <p className="text-xs text-dim font-mono">
        When the bomb flashes a color, the defuser should press the mapped color:
      </p>
      <div className="flex flex-col gap-1.5">
        {mod.colorMap && Object.entries(mod.colorMap).map(([from, to]) => (
          <div key={from} className="flex items-center gap-3 text-sm font-mono">
            <span className={SIMON_BUTTON_STYLES[from]?.text ?? "text-muted"}>
              {from}
            </span>
            <span className="text-dim">→</span>
            <span className={SIMON_BUTTON_STYLES[to]?.text ?? "text-muted"}>
              {to}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Module renderer ───────────────────────────────────────────────────────────

function ModulePanel({
  mod,
  isDefuser,
  cutWire,
  pressKeypad,
  pressSimon,
}: {
  mod:         ModuleView;
  isDefuser:   boolean;
  cutWire:     (mi: number, wi: number) => void;
  pressKeypad: (mi: number, sym: string) => void;
  pressSimon:  (mi: number, color: string) => void;
}) {
  if (mod.type === "wires") {
    return isDefuser
      ? <WireModuleDefuser mod={mod} onCut={(wi) => cutWire(mod.index, wi)} />
      : <WireModuleExpert mod={mod} />;
  }
  if (mod.type === "keypad") {
    return isDefuser
      ? <KeypadModuleDefuser mod={mod} onPress={(sym) => pressKeypad(mod.index, sym)} />
      : <KeypadModuleExpert mod={mod} />;
  }
  if (mod.type === "simon") {
    return isDefuser
      ? <SimonModuleDefuser mod={mod} onPress={(c) => pressSimon(mod.index, c)} />
      : <SimonModuleExpert mod={mod} />;
  }
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BombDefusal({ roomId, myId, players }: Props) {
  const navigate = useNavigate();
  const g = useBombDefusal({ roomId, myId, players });

  // ── Result ──────────────────────────────────────────────────────────────────

  if (g.phase === "defused" || g.phase === "exploded") {
    return (
      <BombResultScreen
        result={g.result!}
        me={g.me!}
        onPlayAgain={() => navigate("/lobby", { replace: true })}
      />
    );
  }

  // ── Active game ─────────────────────────────────────────────────────────────

  const formatTime = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const solvedCount = g.modules.filter((m) => m.solved).length;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="w-full flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`font-display text-lg ${g.isDefuser ? "text-red" : "text-blue"}`}>
              {g.isDefuser ? "💣 DEFUSER" : "📖 EXPERT"}
            </span>
          </div>
          <span className={`font-display text-2xl tabular-nums ${
            g.timeLeft < 30_000 ? "text-red animate-pulse" : "text-muted"
          }`}>
            {formatTime(g.timeLeft)}
          </span>
        </div>

        <TimerBar pct={g.timerPct} strikeFlash={g.strikeFlash} />

        <div className="flex items-center justify-between">
          <StrikeDisplay strikes={g.strikes} max={g.maxStrikes} flash={g.strikeFlash} />
          <span className="font-mono text-xs text-dim">
            Modules: {solvedCount}/{g.modules.length}
          </span>
        </div>
      </div>

      {/* Role banner */}
      <div className={`w-full px-4 py-2 rounded-sm border text-center font-mono text-xs ${
        g.isDefuser
          ? "bg-red/5 border-red/30 text-red"
          : "bg-blue/5 border-blue/30 text-blue"
      }`}>
        {g.isDefuser
          ? "You see the bomb. Describe modules to your experts!"
          : `Defuser: ${g.defuserName}. Tell them what to do based on the manual.`}
      </div>

      {/* Team */}
      <div className="w-full flex flex-wrap gap-2">
        {g.activePlayers.map((p) => (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-2 py-1 rounded-sm border text-xs ${
              p.id === g.defuserId
                ? "border-red/30 bg-red/5"
                : "border-border bg-surface"
            }`}
          >
            <Avatar name={p.name} color={p.avatarColor} size="sm" />
            <span className="font-mono text-muted">{p.name}</span>
            {p.id === g.defuserId && (
              <span className="text-red font-mono text-[10px]">DEF</span>
            )}
          </div>
        ))}
      </div>

      {/* Modules */}
      <div className="w-full flex flex-col gap-4">
        {g.modules.map((mod, i) => (
          <div
            key={i}
            className={`p-4 rounded-sm border transition-all ${
              mod.solved
                ? "border-green/30 bg-green/5"
                : "border-border bg-surface"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={`font-display text-sm ${mod.solved ? "text-green" : "text-dim"}`}>
                Module {i + 1}
              </span>
              <span className="font-mono text-[10px] text-dim uppercase">{mod.type}</span>
            </div>
            <ModulePanel
              mod={mod}
              isDefuser={g.isDefuser}
              cutWire={g.cutWire}
              pressKeypad={g.pressKeypad}
              pressSimon={g.pressSimon}
            />
          </div>
        ))}
      </div>

      {/* End match */}
      <Button variant="ghost" size="sm" onClick={g.requestEndMatch}>
        End Match
      </Button>
    </div>
  );
}
