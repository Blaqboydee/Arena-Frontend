import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom"; // swap for useRouter() if using Next.js
import socket from "../socket";
import type { Player } from "../types";

export type TttPhase = "pending" | "playing" | "round_over" | "match_over";

export type TttRoundResult = {
  winnerId:    string | null;
  winnerName:  string | null;
  reason:      "draw" | "timeout" | "forfeit" | null;
  winLine:     number[] | null;
  board:       (string | null)[];
  scores:      Record<string, number>;
  roundNumber: number;
};

export type TttMatchOver = {
  winnerId:    string | null;
  winnerName:  string | null;
  scores:      Record<string, number>;
  totalRounds: number;
};

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

const TIMER_MS = 15_000;

export function useTicTacToe({ roomId, myId, players }: Props) {
  const navigate = useNavigate(); // swap for useRouter() if using Next.js

  const [board, setBoard]             = useState<(string | null)[]>(Array(9).fill(null));
  const [turnId, setTurnId]           = useState<string>("");
  const [mySymbol, setMySymbol]       = useState<string>("X");
  const [scores, setScores]           = useState<Record<string, number>>(
    Object.fromEntries(players.map((p) => [p.id, 0]))
  );
  const [roundNumber, setRoundNumber] = useState<number>(0);
  const [phase, setPhase]             = useState<TttPhase>("pending");
  const [roundResult, setRoundResult] = useState<TttRoundResult | null>(null);
  const [matchOver, setMatchOver]     = useState<TttMatchOver | null>(null);
  const [timeLeft, setTimeLeft]       = useState<number>(TIMER_MS);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [hoverIndex, setHoverIndex]   = useState<number | null>(null);

  const timerStartRef  = useRef<number>(0);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracks whether the game was ever live in this browser session.
  // Resets to false on every page load, so a refresh mid-game is detectable.
  const hasBeenInGame  = useRef(false);

  // ── Timer ──────────────────────────────────────────────────────────────────

  function startCountdown() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerStartRef.current = Date.now();
    setTimeLeft(TIMER_MS);

    intervalRef.current = setInterval(() => {
      const elapsed   = Date.now() - timerStartRef.current;
      const remaining = Math.max(0, TIMER_MS - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 100);
  }

  function stopCountdown() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => () => stopCountdown(), []);

  // ── Mark game as live once it leaves "pending" ─────────────────────────────
  // This ref flips to true the moment the first ttt_update arrives.
  // On a fresh page load it starts false, so if we see phase === "pending"
  // while hasBeenInGame is still false, we know it's a genuine first load.
  // If hasBeenInGame is true and we somehow land back on "pending" (shouldn't
  // happen normally), treat it as a stale state and bail to lobby.
  useEffect(() => {
    if (phase === "playing" || phase === "round_over") {
      hasBeenInGame.current = true;
    }
  }, [phase]);

  // ── Stale-pending guard (refresh mid-game) ─────────────────────────────────
  // After a refresh the socket reconnects and the server sees a disconnect +
  // reconnect, awarding a forfeit win to the opponent via handleTttForfeit.
  // The refreshing player ends up on a dead socket with phase stuck at
  // "pending" forever. Redirect them to lobby after a short grace period
  // so they aren't stranded on a spinner.
  useEffect(() => {
    if (phase !== "pending") return;
    if (hasBeenInGame.current) {
      // Was live before — this is definitely a stale state after a refresh.
      navigate("/lobby", { replace: true });
      return;
    }

    // Fresh load: give the server START_DELAY_MS (1.5 s) + a small buffer
    // before declaring it stuck. If ttt_update hasn't arrived after 4 s,
    // something went wrong — send the player back to lobby.
    const safeguardTimer = setTimeout(() => {
      if (!hasBeenInGame.current) {
        navigate("/lobby", { replace: true });
      }
    }, 4_000);

    return () => clearTimeout(safeguardTimer);
  }, [phase, navigate]);

  // ── beforeunload: fire-and-forget forfeit beacon ───────────────────────────
  // sendBeacon survives page unload where fetch/socket.emit do not.
  // The server-side disconnect handler is the primary forfeit mechanism;
  // this beacon is a belt-and-suspenders signal for the HTTP layer.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase !== "playing" && phase !== "round_over") return;

      navigator.sendBeacon(
        `/api/rooms/${roomId}/forfeit`,
        JSON.stringify({ playerId: myId, reason: "disconnect" }),
      );

      // Prompt the browser's native "Leave site?" dialog.
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase, roomId, myId]);

  // ── Socket events ──────────────────────────────────────────────────────────

  useEffect(() => {
    socket.on("ttt_update", (data: {
      board:       (string | null)[];
      turnId:      string;
      yourSymbol:  string;
      scores:      Record<string, number>;
      roundNumber: number;
      timeLimit:   number;
    }) => {
      setBoard(data.board);
      setTurnId(data.turnId);
      setMySymbol(data.yourSymbol);
      setScores(data.scores);
      setRoundNumber(data.roundNumber);
      setPhase("playing");
      setRoundResult(null);
      setHoverIndex(null);
      startCountdown();
    });

    socket.on("ttt_round_result", (data: TttRoundResult) => {
      stopCountdown();
      setBoard(data.board);
      setScores(data.scores);
      setRoundNumber(data.roundNumber);
      setRoundResult(data);
      setPhase("round_over");
      setHoverIndex(null);
    });

    socket.on("ttt_match_over", (data: TttMatchOver) => {
      stopCountdown();
      setMatchOver(data);
      setPhase("match_over");
    });

    return () => {
      socket.off("ttt_update");
      socket.off("ttt_round_result");
      socket.off("ttt_match_over");
      stopCountdown();
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const makeMove = useCallback((cellIndex: number) => {
    if (phase !== "playing") return;
    if (turnId !== myId)     return;
    if (board[cellIndex] !== null) return;
    socket.emit("ttt_move", { roomId, cellIndex });
  }, [phase, turnId, myId, board, roomId]);

  const requestEndMatch = useCallback(() => setShowConfirmEnd(true),  []);
  const confirmEndMatch = useCallback(() => {
    setShowConfirmEnd(false);
    socket.emit("ttt_end_match", { roomId });
  }, [roomId]);
  const cancelEndMatch  = useCallback(() => setShowConfirmEnd(false), []);

  // ── Derived ────────────────────────────────────────────────────────────────

  const isMyTurn = turnId === myId;
  const me       = players.find((p) => p.id === myId);
  const opponent = players.find((p) => p.id !== myId);
  const myScore  = scores[myId] ?? 0;
  const oppScore = opponent ? (scores[opponent.id] ?? 0) : 0;
  const timerPct = (timeLeft / TIMER_MS) * 100;

  return {
    board, turnId, mySymbol, scores, roundNumber,
    phase, roundResult, matchOver,
    timeLeft, timerPct, isMyTurn,
    me, opponent, myScore, oppScore,
    showConfirmEnd, hoverIndex, setHoverIndex,
    makeMove, requestEndMatch, confirmEndMatch, cancelEndMatch,
  };
}