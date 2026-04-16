import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import { useSession } from "../hooks/useSession";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import ColorPicker from "../components/ui/ColorPicker";
import type { AvatarColor, GameType, Player } from "../types";

type Phase =
  | "enter_name"   // no session yet — show name form
  | "joining"      // session exists, attempting to join
  | "error";       // bad code or room full

// ── Decorative grid (reused from Landing) ─────────────────────────────────────
function GridLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[25, 50, 75].map((p) => (
        <div key={p} className="absolute w-full h-px bg-border/40" style={{ top: `${p}%` }} />
      ))}
      {[25, 50, 75].map((p) => (
        <div key={p} className="absolute h-full w-px bg-border/20" style={{ left: `${p}%` }} />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(245,166,35,0.04)_0%,transparent_70%)]" />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
// File renamed to JoinViaLink.tsx to fix casing issue
export default function JoinViaLink() {
  const { code }    = useParams<{ code: string }>();
  const navigate    = useNavigate();
  const { session, setSession } = useSession();

  const [phase, setPhase]       = useState<Phase>(session ? "joining" : "enter_name");
  const [nameInput, setNameInput] = useState("");
  const [color, setColor]       = useState<AvatarColor>("amber");
  const [nameError, setNameError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Attempt to join once we have a session ─────────────────────────────────
  useEffect(() => {
    if (phase !== "joining" || !code) return;

    const name        = session?.name        ?? nameInput.trim();
    const avatarColor = session?.avatarColor ?? color;

    if (!socket.connected) socket.connect();

    socket.emit("set_session", { name, avatarColor });
    socket.emit("join_room", { inviteCode: code.toUpperCase() });

    socket.on("join_error", (data: { message: string }) => {
      setErrorMsg(data.message);
      setPhase("error");
    });

    socket.on(
      "match_found",
      (data: { roomId: string; gameType: GameType; players: Player[]; yourId: string }) => {
        navigate(`/game/${data.roomId}`, {
          state: {
            gameType: data.gameType,
            players:  data.players,
            yourId:   data.yourId,
          },
        });
      }
    );

    // Multi-player rooms: redirect to lobby to wait in the room
    socket.on("room_player_update", () => {
      navigate("/lobby", { replace: true });
    });

    return () => {
      socket.off("join_error");
      socket.off("match_found");
      socket.off("room_player_update");
    };
  }, [phase, code, session, navigate, nameInput, color]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleEnter() {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed.length < 2) {
      setNameError("Name must be at least 2 characters.");
      return;
    }
    setSession({ name: trimmed, avatarColor: color });
    setPhase("joining");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="noise-bg min-h-screen flex flex-col items-center justify-center bg-bg relative overflow-hidden px-6">
      <GridLines />

      {/* Wordmark */}
      <div className="absolute top-0 left-0 right-0 border-b border-border py-3 px-6 z-10">
        <span className="font-display text-xl tracking-arena text-text">ARENA</span>
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-6">

        {/* ── Enter name (no session) ── */}
        {phase === "enter_name" && (
          <div className="bracket-card bg-surface border border-border rounded-sm p-8 flex flex-col gap-6 slide-up-1">
            {/* Header */}
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] text-dim tracking-widest uppercase">
                You were invited
              </span>
              <h1 className="font-display text-4xl tracking-wide text-text">
                Join Game
              </h1>
              <p className="font-mono text-xs text-muted">
                Enter your callsign to accept the challenge.
              </p>
            </div>

            {/* Invite code badge */}
            <div className="flex items-center gap-3 bg-bg border border-border rounded-sm px-4 py-3">
              <span className="font-mono text-[10px] text-dim tracking-widest uppercase">
                Code
              </span>
              <span className="font-display text-2xl tracking-[0.25em] text-amber">
                {code?.toUpperCase()}
              </span>
            </div>

            {/* Name + avatar */}
            <div className="flex items-center gap-3">
              <Avatar name={nameInput || "?"} color={color} size="lg" />
              <div className="flex-1 flex flex-col gap-1">
                <input
                  value={nameInput}
                  onChange={(e) => { setNameInput(e.target.value); setNameError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleEnter()}
                  maxLength={20}
                  placeholder="Enter callsign…"
                  autoFocus
                  className="
                    w-full bg-bg border border-border rounded-sm
                    px-3 py-2.5 font-mono text-base text-text
                    placeholder-dim outline-none
                    focus:border-amber/60 transition-colors duration-150
                  "
                />
                {nameError && (
                  <p className="font-mono text-[11px] text-red">{nameError}</p>
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

            <Button variant="primary" size="md" fullWidth onClick={handleEnter}
              className="amber-pulse">
              Accept Challenge →
            </Button>

            <button
              onClick={() => navigate("/")}
              className="font-mono text-[11px] text-dim text-center hover:text-muted transition-colors"
            >
              Go to landing instead
            </button>
          </div>
        )}

        {/* ── Joining spinner ── */}
        {phase === "joining" && (
          <div className="flex flex-col items-center gap-6 slide-up-1">
            <div className="w-10 h-10 rounded-full border-2 border-border border-t-amber animate-spin" />
            <div className="flex flex-col items-center gap-2">
              <p className="font-mono text-sm text-muted">Joining room</p>
              <span className="font-display text-3xl tracking-[0.25em] text-amber">
                {code?.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {phase === "error" && (
          <div className="bracket-card bg-surface border border-red/30 rounded-sm p-8 flex flex-col gap-6 slide-up-1">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] text-red tracking-widest uppercase">
                Failed to join
              </span>
              <h2 className="font-display text-3xl tracking-wide text-text">
                {errorMsg || "Room not found"}
              </h2>
              <p className="font-mono text-xs text-muted">
                The invite code may be expired, the room may be full, or the game has already started.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="primary" size="md" fullWidth onClick={() => navigate("/")}>
                Go to Arena
              </Button>
              <Button variant="ghost" size="sm" fullWidth onClick={() => setPhase("enter_name")}>
                Try again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}