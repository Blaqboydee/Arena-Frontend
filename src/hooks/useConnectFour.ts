import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import type { Player } from "../types";

export type C4Phase = "pending" | "playing" | "round_over" | "match_over";

export type C4RoundResult = {
  winnerId:    string | null;
  winnerName:  string | null;
  reason:      "connect4" | "draw" | "timeout" | "forfeit" | null;
  board:       (string | null)[][];
  winCells:    number[][] | null;
  scores:      Record<string, number>;
  roundNumber: number;
};

export type C4MatchOver = {
  winnerId:    string | null;
  winnerName:  string | null;
  scores:      Record<string, number>;
  totalRounds: number;
  reason?:     string;
};

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

const ROWS     = 6;
const COLS     = 7;
const TIMER_MS = 20_000;

function emptyBoard(): (string | null)[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function useConnectFour({ roomId, myId, players }: Props) {
  const navigate = useNavigate();

  const [board, setBoard]             = useState<(string | null)[][]>(emptyBoard());
  const [turnId, setTurnId]           = useState<string>("");
  const [myColor, setMyColor]         = useState<string>("red");
  const [scores, setScores]           = useState<Record<string, number>>(
    Object.fromEntries(players.map((p) => [p.id, 0]))
  );
  const [roundNumber, setRoundNumber] = useState<number>(0);
  const [phase, setPhase]             = useState<C4Phase>("pending");
  const [roundResult, setRoundResult] = useState<C4RoundResult | null>(null);
  const [matchOver, setMatchOver]     = useState<C4MatchOver | null>(null);
  const [timeLeft, setTimeLeft]       = useState<number>(TIMER_MS);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [hoverCol, setHoverCol]       = useState<number | null>(null);
  const [lastMove, setLastMove]       = useState<{ row: number; col: number; color: string } | null>(null);

  const timerStartRef = useRef<number>(0);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasBeenInGame = useRef(false);

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

  useEffect(() => {
    if (phase === "playing" || phase === "round_over") {
      hasBeenInGame.current = true;
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "pending") return;
    if (hasBeenInGame.current) {
      navigate("/lobby", { replace: true });
      return;
    }
    const safeguardTimer = setTimeout(() => {
      if (!hasBeenInGame.current) navigate("/lobby", { replace: true });
    }, 4_000);
    return () => clearTimeout(safeguardTimer);
  }, [phase, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase !== "playing" && phase !== "round_over") return;
      navigator.sendBeacon(
        `/api/rooms/${roomId}/forfeit`,
        JSON.stringify({ playerId: myId, reason: "disconnect" }),
      );
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase, roomId, myId]);

  // ── Socket events ──────────────────────────────────────────────────────────

  useEffect(() => {
    socket.on("c4_round_start", (data: {
      roundNumber: number;
      turnId:      string;
      board:       (string | null)[][];
      scores:      Record<string, number>;
      colors:      Record<string, string>;
      players:     Player[];
    }) => {
      setBoard(data.board);
      setTurnId(data.turnId);
      setMyColor(data.colors[myId] ?? "red");
      setScores(data.scores);
      setRoundNumber(data.roundNumber);
      setPhase("playing");
      setRoundResult(null);
      setLastMove(null);
      setHoverCol(null);
    });

    socket.on("c4_update", (data: {
      board:       (string | null)[][];
      turnId:      string;
      scores:      Record<string, number>;
      colors:      Record<string, string>;
      roundNumber: number;
      lastMove:    { row: number; col: number; color: string } | null;
      players:     Player[];
    }) => {
      setBoard(data.board);
      setTurnId(data.turnId);
      setMyColor(data.colors[myId] ?? "red");
      setScores(data.scores);
      setRoundNumber(data.roundNumber);
      setLastMove(data.lastMove);
      setPhase("playing");
      setHoverCol(null);
    });

    socket.on("c4_timer", () => {
      startCountdown();
    });

    socket.on("c4_round_result", (data: C4RoundResult) => {
      stopCountdown();
      setBoard(data.board);
      setScores(data.scores);
      setRoundNumber(data.roundNumber);
      setRoundResult(data);
      setPhase("round_over");
      setHoverCol(null);
    });

    socket.on("c4_match_over", (data: C4MatchOver) => {
      stopCountdown();
      setMatchOver(data);
      setPhase("match_over");
    });

    return () => {
      socket.off("c4_round_start");
      socket.off("c4_update");
      socket.off("c4_timer");
      socket.off("c4_round_result");
      socket.off("c4_match_over");
      stopCountdown();
    };
  }, [myId]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const dropDisc = useCallback((col: number) => {
    if (phase !== "playing") return;
    if (turnId !== myId)     return;
    socket.emit("c4_move", { roomId, col });
  }, [phase, turnId, myId, roomId]);

  const requestEndMatch = useCallback(() => setShowConfirmEnd(true),  []);
  const confirmEndMatch = useCallback(() => {
    setShowConfirmEnd(false);
    socket.emit("c4_end_match", { roomId });
  }, [roomId]);
  const cancelEndMatch  = useCallback(() => setShowConfirmEnd(false), []);

  // ── Derived ────────────────────────────────────────────────────────────────

  const isMyTurn = turnId === myId;
  const me       = players.find((p) => p.id === myId);
  const opponent = players.find((p) => p.id !== myId);
  const myScore  = scores[myId] ?? 0;
  const oppScore = opponent ? (scores[opponent.id] ?? 0) : 0;
  const timerPct = (timeLeft / TIMER_MS) * 100;
  const oppColor = myColor === "red" ? "yellow" : "red";

  return {
    board, turnId, myColor, oppColor, scores, roundNumber,
    phase, roundResult, matchOver,
    timeLeft, timerPct, isMyTurn,
    me, opponent, myScore, oppScore,
    showConfirmEnd, hoverCol, setHoverCol, lastMove,
    dropDisc, requestEndMatch, confirmEndMatch, cancelEndMatch,
  };
}
