import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";
import { useSession } from "../hooks/useSession";
import type { GameType, Player } from "../types";
import ReactionGame from "../components/games/ReactionGame";
import TicTacToe   from "../components/games/TicTacToe";
import Hangman     from "../components/games/HangMan";
import ConnectFour from "../components/games/ConnectFour";
import WordleDuel  from "../components/games/WordleDuel";
import WouldYouRather from "../components/games/WouldYouRather";
import MemoryDuel from "../components/games/MemoryDuel";
import TriviaRoyale from "../components/games/TriviaRoyale";
import BombDefusal from "../components/games/BombDefusal";
import Button from "../components/ui/Button";
import Avatar from "../components/ui/Avatar";
import ConnectionBadge from "../components/ui/ConnectionBadge";
import PromoModal from "../components/ui/PromoModal";
import { useConnectionStatus } from "../hooks/useConnectionStatus";

// ── Types ─────────────────────────────────────────────────────────────────────

type LocationState = {
  gameType: GameType;
  players:  Player[];
  yourId:   string;
};

// ── Opponent left banner ──────────────────────────────────────────────────────

function OpponentLeftBanner({ name, onLeave }: { name: string; onLeave: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bg/80 backdrop-blur-sm">
      <div className="bracket-card bg-surface border border-border rounded-sm p-8 w-full max-w-sm flex flex-col gap-6 items-center text-center">
        <span className="text-5xl">👻</span>
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-3xl tracking-wide text-text">
            Opponent Left
          </h2>
          <p className="font-mono text-xs text-muted">
            {name} disconnected. The match has ended.
          </p>
        </div>
        <Button variant="primary" size="md" fullWidth onClick={onLeave}>
          Back to Lobby
        </Button>
      </div>
    </div>
  );
}

// ── You disconnected overlay ──────────────────────────────────────────────────

function DisconnectedOverlay({ onLeave }: { onLeave: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bg/80 backdrop-blur-sm">
      <div className="bracket-card bg-surface border border-red/30 rounded-sm p-8 w-full max-w-sm flex flex-col gap-6 items-center text-center">
        <span className="text-5xl">📡</span>
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-3xl tracking-wide text-red">
            Disconnected
          </h2>
          <p className="font-mono text-xs text-muted">
            You lost connection to the server. The match may have ended.
          </p>
        </div>
        <Button variant="primary" size="md" fullWidth onClick={onLeave}>
          Back to Lobby
        </Button>
      </div>
    </div>
  );
}

// ── Game top bar ──────────────────────────────────────────────────────────────

function GameBar({ gameType, players, myId }: { gameType: GameType; players: Player[]; myId: string }) {
  const me       = players.find((p) => p.id === myId);
  const others   = players.filter((p) => p.id !== myId);

  const gameLabels: Record<GameType, string> = {
    reaction:       "Reaction",
    tictactoe:      "Tic Tac Toe",
    hangman:        "Hangman",
    connectfour:    "Connect Four",
    wordle:         "Wordle Duel",
    wouldyourather: "Would You Rather",
    memoryduel:     "Memory Duel",
    triviaroyale:   "Trivia Royale",
    bombdefusal:    "Bomb Defusal",
  };

  return (
    <div className="relative z-10 border-b border-border bg-surface/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Left: brand + game */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <span className="font-display text-base sm:text-xl tracking-arena text-text shrink-0">ARENA</span>
          <span className="w-px h-4 bg-border shrink-0" />
          <span className="font-mono text-[10px] sm:text-xs text-muted tracking-widest uppercase truncate">
            {gameLabels[gameType] ?? gameType}
          </span>
        </div>

        {/* Right: connection + players (names hidden on phones) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ConnectionBadge />
          {me && (
            <div className="flex items-center gap-1.5">
              <Avatar name={me.name} color={me.avatarColor} seed={me.avatar} size="sm" />
              <span className="font-mono text-xs text-muted hidden sm:inline max-w-[80px] truncate">{me.name}</span>
            </div>
          )}
          {others.length === 1 && (
            <>
              <span className="font-mono text-[10px] text-dim">vs</span>
              <div className="flex items-center gap-1.5">
                <Avatar name={others[0].name} color={others[0].avatarColor} seed={others[0].avatar} size="sm" />
                <span className="font-mono text-xs text-muted hidden sm:inline max-w-[80px] truncate">{others[0].name}</span>
              </div>
            </>
          )}
          {others.length > 1 && (
            <span className="font-mono text-xs text-dim">+{others.length}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Game() {
  const { roomId }   = useParams<{ roomId: string }>();
  const location     = useLocation();
  const navigate     = useNavigate();
  const { session }  = useSession();

  const state = location.state as LocationState | null;

  const [opponentLeft, setOpponentLeft] = useState(false);
  const [opponentName, setOpponentName] = useState("Opponent");
  const [showPromo, setShowPromo]         = useState(false);
  const connectionStatus = useConnectionStatus();

  // Live match identity — starts from the navigation state, but a rematch (the
  // server re-launching in the same room) updates it and remounts the game.
  const [players, setPlayers]   = useState<Player[]>(() => state?.players ?? []);
  const [yourId, setYourId]     = useState<string>(() => state?.yourId ?? "");
  const [matchKey, setMatchKey] = useState(0);        // bump → fresh game mount
  const [matchOver, setMatchOver] = useState(false);  // any game's match-over event
  const [rematchMsg, setRematchMsg] = useState("");

  const isHost = players[0]?.id === yourId;

  // ── Rematch: play again in the same room, for everyone still here ───────────
  useEffect(() => {
    const onMatchFound = (data: { roomId: string; players: Player[]; yourId: string }) => {
      if (data.roomId !== roomId) return;
      setPlayers(data.players);
      setYourId(data.yourId);
      setOpponentLeft(false);
      setMatchOver(false);
      setRematchMsg("");
      setMatchKey((k) => k + 1); // remount the game component → clean fresh state
    };
    const onFailed = (data: { message?: string }) =>
      setRematchMsg(data?.message ?? "Couldn't start a rematch.");
    const onOver = () => setMatchOver(true);

    const overEvents = [
      "ttt_match_over", "hm_match_over", "c4_match_over", "wdl_match_over",
      "wyr_match_over", "mem_match_over", "triv_match_over", "bomb_result",
    ];

    socket.on("match_found", onMatchFound);
    socket.on("play_again_failed", onFailed);
    overEvents.forEach((e) => socket.on(e, onOver));
    return () => {
      socket.off("match_found", onMatchFound);
      socket.off("play_again_failed", onFailed);
      overEvents.forEach((e) => socket.off(e, onOver));
    };
  }, [roomId]);

  // ── Leave the room on real exit (so we don't linger as a ghost) ────────────
  // StrictMode double-invokes effects in dev; defer the emit one tick so a
  // same-instance remount cancels the spurious leave. A real unmount lets it fire.
  const leaveTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (leaveTimer.current !== undefined) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = undefined;
    }
    return () => {
      leaveTimer.current = window.setTimeout(() => {
        if (socket.connected) socket.emit("leave_room", { roomId });
      }, 0);
    };
  }, [roomId]);

  // ── Guard: must have valid state to render ─────────────────────────────────
  useEffect(() => {
    if (!state?.gameType || !state?.players || !state?.yourId || !roomId) {
      navigate("/lobby", { replace: true });
    }
  }, [state, roomId, navigate]);

  // ── Reconnect socket if needed (e.g. page refresh) ─────────────────────────
  useEffect(() => {
    if (!socket.connected && session) {
      socket.connect();
      socket.emit("set_session", {
        name:        session.name,
        avatarColor: session.avatarColor,
        avatar:      session.avatar ?? "",
      });
    }
  }, [session]);

  // ── Opponent disconnect handler ────────────────────────────────────────────
  useEffect(() => {
    if (!state?.players || !state?.yourId) return;

    const opp = state.players.find((p) => p.id !== state.yourId);
    if (opp) setOpponentName(opp.name);

    socket.on("opponent_left", () => {
      setOpponentLeft(true);
    });

    return () => {
      socket.off("opponent_left");
    };
  }, [state]);

  // ── Promo modal — disabled for now (don't nag first-time users) ────────────
  // PromoModal + showPromo state stay wired; re-enable by restoring a post-game
  // trigger that calls setShowPromo(true).

  // ── Guard render ───────────────────────────────────────────────────────────
  if (!state?.gameType || !state?.players || !state?.yourId || !roomId) {
    return null;
  }

  const { gameType } = state;

  // ── Game router ────────────────────────────────────────────────────────────
  function renderGame() {
    switch (gameType) {
      case "reaction":
        return (
          <ReactionGame
            roomId={roomId!}
            myId={yourId}
            players={players}
          />
        );
      case "tictactoe":
        return (
          <TicTacToe
            roomId={roomId!}
            myId={yourId}
            players={players}
          />
        );
      case "hangman":
        return (
          <Hangman
            roomId={roomId!}
            myId={yourId}
            players={players}
          />
        );
      case "connectfour":
        return (
          <ConnectFour
            roomId={roomId!}
            myId={yourId}
            players={players}
          />
        );
      case "wordle":
        return (
          <WordleDuel
            roomId={roomId!}
            myId={yourId}
            players={players}
          />
        );
      case "wouldyourather":
        return (
          <WouldYouRather
            roomId={roomId!}
            myId={yourId}
            players={players}
          />
        );
      case "memoryduel":
        return (
          <MemoryDuel
            roomId={roomId!}
            myId={yourId}
            players={players}
          />
        );
      case "triviaroyale":
        return (
          <TriviaRoyale
            roomId={roomId!}
            myId={yourId}
            players={players}
          />
        );
      case "bombdefusal":
        return (
          <BombDefusal
            roomId={roomId!}
            myId={yourId}
            players={players}
          />
        );
      default:
        return (
          <p className="font-mono text-muted">
            Unknown game type: {gameType}
          </p>
        );
    }
  }

  return (
    <div className="noise-bg min-h-screen flex flex-col bg-bg">

      {/* Top bar */}
      <GameBar gameType={gameType} players={players} myId={yourId} />

      {/* Game area — keyed so a rematch remounts the game cleanly */}
      <main className={`flex-1 flex flex-col items-center justify-center px-6 py-10 ${matchOver ? "pb-28" : ""}`}>
        <div key={matchKey} style={{ display: "contents" }}>
          {renderGame()}
        </div>
      </main>

      {/* Play-again bar — shown once a match ends (not after a disconnect/leave) */}
      {matchOver && !opponentLeft && connectionStatus !== "disconnected" && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md">
          <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
            {isHost ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => { setRematchMsg(""); socket.emit("play_again", { roomId }); }}
                >
                  ↻ Play again
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/lobby")}>
                  Leave
                </Button>
              </>
            ) : (
              <span className="font-mono text-xs text-muted">Waiting for host to start a rematch…</span>
            )}
          </div>
          {rematchMsg && (
            <p className="pb-2 text-center font-mono text-[11px] text-red/90">{rematchMsg}</p>
          )}
        </div>
      )}

      {/* Opponent left overlay */}
      {opponentLeft && (
        <OpponentLeftBanner
          name={opponentName}
          onLeave={() => navigate("/lobby")}
        />
      )}

      {/* You disconnected overlay — only show if opponent hasn't already left */}
      {!opponentLeft && connectionStatus === "disconnected" && (
        <DisconnectedOverlay onLeave={() => navigate("/lobby")} />
      )}

      {/* Promo modal */}
      {showPromo && <PromoModal onClose={() => setShowPromo(false)} />}
    </div>
  );
}