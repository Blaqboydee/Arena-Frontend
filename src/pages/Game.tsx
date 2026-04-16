import { useEffect, useState } from "react";
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
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <span className="font-display text-xl tracking-arena text-text">ARENA</span>

        <span className="font-mono text-xs text-muted tracking-widest uppercase">
          {gameLabels[gameType] ?? gameType}
        </span>

        <div className="flex items-center gap-3">
          {me && (
            <div className="flex items-center gap-1.5">
              <Avatar name={me.name} color={me.avatarColor} size="sm" />
              <span className="font-mono text-xs text-muted">{me.name}</span>
            </div>
          )}
          {others.length === 1 && (
            <>
              <span className="font-mono text-xs text-dim">vs</span>
              <div className="flex items-center gap-1.5">
                <Avatar name={others[0].name} color={others[0].avatarColor} size="sm" />
                <span className="font-mono text-xs text-muted">{others[0].name}</span>
              </div>
            </>
          )}
          {others.length > 1 && (
            <span className="font-mono text-xs text-dim">
              +{others.length} players
            </span>
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

  // ── Guard render ───────────────────────────────────────────────────────────
  if (!state?.gameType || !state?.players || !state?.yourId || !roomId) {
    return null;
  }

  const { gameType, players, yourId } = state;

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

      {/* Game area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {renderGame()}
      </main>

      {/* Opponent left overlay */}
      {opponentLeft && (
        <OpponentLeftBanner
          name={opponentName}
          onLeave={() => navigate("/lobby")}
        />
      )}
    </div>
  );
}