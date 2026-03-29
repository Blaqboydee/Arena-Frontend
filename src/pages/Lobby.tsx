import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLobby } from "../hooks/useLobby";
import GameCard, { GAMES } from "../components/GameCard";
import { CreatedRoomModal, JoinRoomModal } from "../components/InviteModal";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

// ── Decorative grid lines (same as landing) ───────────────────────────────────
function GridLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[20, 40, 60, 80].map((pct) => (
        <div key={pct} className="absolute w-full h-px bg-border/40"
          style={{ top: `${pct}%` }} />
      ))}
      {[20, 40, 60, 80].map((pct) => (
        <div key={pct} className="absolute h-full w-px bg-border/20"
          style={{ left: `${pct}%` }} />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(245,166,35,0.03)_0%,transparent_70%)]" />
    </div>
  );
}

// ── Top navigation bar ────────────────────────────────────────────────────────
function TopBar({
  name,
  avatarColor,
  onJoinRoom,
  onLeave,
}: {
  name: string;
  avatarColor: any;
  onJoinRoom: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="relative z-10 border-b border-border bg-surface/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Wordmark */}
        <span className="font-display text-xl tracking-arena text-text">
          ARENA
        </span>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Badge variant="green" dot>Live</Badge>

          <Button variant="ghost" size="sm" onClick={onJoinRoom}>
            Join with code
          </Button>

          {/* Player identity */}
          <div className="flex items-center gap-2 border-l border-border pl-4">
            <Avatar name={name} color={avatarColor} size="sm" />
            <span className="font-mono text-xs text-muted">{name}</span>
          </div>

          <Button variant="ghost" size="sm" onClick={onLeave}>
            Leave
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Lobby() {
  const navigate = useNavigate();
  const {
    phase,
    session,
    queueCounts,
    queuedGame,
    inviteCode,
    inviteInput,
    setInviteInput,
    joinError,
    findMatch,
    cancelMatch,
    createRoom,
    joinRoom,
    openJoinDialog,
    cancelPrivateRoom,
  } = useLobby();

  // Redirect to landing if no session
  useEffect(() => {
    if (!session) navigate("/", { replace: true });
  }, [session, navigate]);

  if (!session) return null;

  const anyQueuing = phase === "queuing" || phase === "creating_room";

  return (
    <div className="noise-bg min-h-screen flex flex-col bg-bg relative overflow-hidden">
      <GridLines />

      {/* Top bar */}
      <TopBar
        name={session.name}
        avatarColor={session.avatarColor}
        onJoinRoom={openJoinDialog}
        onLeave={() => navigate("/")}
      />

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-6 py-12 gap-10">

        {/* Page heading */}
        <div className="flex flex-col items-center gap-2 slide-up-1">
          <div className="rule-label w-48">
            <span>Choose your game</span>
          </div>
          <h1 className="font-display text-6xl tracking-arena text-text">
            LOBBY
          </h1>
        </div>

        {/* Game grid */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 slide-up-2">
          {GAMES.map((game) => (
            <GameCard
              key={game.gameType}
              game={game}
              queueCount={queueCounts[game.gameType] ?? 0}
              isQueuing={phase === "queuing" && queuedGame === game.gameType}
              anyQueuing={anyQueuing}
              onQuickMatch={() => findMatch(game.gameType)}
              onPrivateRoom={() => createRoom(game.gameType)}
              onCancel={cancelMatch}
            />
          ))}
        </div>

        {/* Footer hint */}
        <p className="font-mono text-[11px] text-dim tracking-widest slide-up-3">
          No account needed · Games are free · Invite a friend anytime
        </p>
      </main>

      {/* Modals */}
      {phase === "creating_room" && queuedGame && (
        <CreatedRoomModal
          inviteCode={inviteCode}
          gameLabel={GAMES.find((g) => g.gameType === queuedGame)?.label ?? ""}
          onCancel={cancelPrivateRoom}
        />
      )}

      {phase === "joining_room" && (
        <JoinRoomModal
          value={inviteInput}
          onChange={setInviteInput}
          onJoin={joinRoom}
          onCancel={cancelPrivateRoom}
          error={joinError}
        />
      )}
    </div>
  );
}