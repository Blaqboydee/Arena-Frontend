import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLobby } from "../hooks/useLobby";
import GameCard, { GAMES } from "../components/GameCard";
import { CreatedRoomModal, JoinRoomModal } from "../components/InviteModal";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import TriviaSetup from "../components/TriviaSetup";
import type { AvatarColor } from "../types";
// import Button from "../components/ui/Button";

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
  avatarColor: AvatarColor;
  onJoinRoom: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="relative z-10 border-b border-border bg-surface/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">

        {/* Wordmark */}
        <span className="font-display text-xl tracking-arena text-text shrink-0">
          ARENA
        </span>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">

          {/* Live badge — hidden on very small screens */}
          <Badge variant="green" dot>
            <span className="hidden sm:inline">Live</span>
          </Badge>

          {/* Join with code — highlighted amber button, always visible */}
          <button
            onClick={onJoinRoom}
            className="
              flex items-center gap-1.5 shrink-0
              bg-amber/10 border border-amber/40 text-amber
              hover:bg-amber/20 hover:border-amber/70
              active:scale-95
              font-mono text-[11px] sm:text-xs tracking-widest uppercase
              px-3 py-2 rounded-sm
              transition-all duration-150
              amber-pulse
            "
          >
            {/* Key icon */}
            <svg
              width="12" height="12" viewBox="0 0 16 16"
              fill="none" xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12 12L13.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {/* Full label on sm+, icon-only on xs */}
            <span className="hidden xs:inline sm:inline">Join room</span>
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-border shrink-0" />

          {/* Player identity */}
          <div className="flex items-center gap-2 min-w-0">
            <Avatar name={name} color={avatarColor} size="sm" />
            {/* Name — hidden on small screens to save space */}
            <span className="font-mono text-xs text-muted truncate hidden sm:block max-w-[120px]">
              {name}
            </span>
          </div>

          {/* Leave — text on sm+, minimal on xs */}
          <button
            onClick={onLeave}
            className="
              font-mono text-[11px] text-dim tracking-widest uppercase
              hover:text-muted active:scale-95
              transition-all duration-150 shrink-0 px-1
            "
          >
            <span className="hidden sm:inline">Leave</span>
            {/* Exit icon on xs */}
            <svg
              className="sm:hidden w-4 h-4"
              viewBox="0 0 16 16" fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6 3H3V13H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 5L13 8L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 8H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
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
    roomUpdate,
    triviaConfig,
    setTriviaConfig,
    findMatch,
    cancelMatch,
    createRoom,
    joinRoom,
    openJoinDialog,
    cancelPrivateRoom,
    startGame,
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

        {/* Game grid — grouped by player count */}
        <div className="w-full max-w-4xl flex flex-col gap-8 slide-up-2">

          {/* 1v1 Games */}
          {(() => {
            const duoGames = GAMES.filter(g => g.playerCount.max === 2 && g.playerCount.min === 2);
            return duoGames.length > 0 ? (
              <section>
                <div className="rule-label w-32 mb-4"><span>1v1 Games</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {duoGames.map((game) => (
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
              </section>
            ) : null;
          })()}

          {/* Party Games (3+) */}
          {(() => {
            const partyGames = GAMES.filter(g => g.playerCount.max > 2);
            return partyGames.length > 0 ? (
              <section>
                <div className="rule-label w-40 mb-4"><span>Party & Co-op</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {partyGames.map((game) => (
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
              </section>
            ) : null;
          })()}
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
          roomUpdate={roomUpdate}
          onStartGame={startGame}
          setupPanel={
            queuedGame === "triviaroyale"
              ? <TriviaSetup config={triviaConfig} onChange={setTriviaConfig} />
              : undefined
          }
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