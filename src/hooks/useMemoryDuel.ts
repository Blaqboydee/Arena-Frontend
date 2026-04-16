import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket, { BACKEND_URL } from "../socket";
import type { Player } from "../types";

export type MemPhase = "pending" | "playing" | "round_over" | "match_over";

export type MemCard = {
  id:      number;
  emoji:   string | null;
  flipped: boolean;
  matched: boolean;
};

export type MemRoundResult = {
  winnerId:    string | null;
  winnerName:  string | null;
  pairs:       Record<string, number>;
  scores:      Record<string, number>;
  roundNumber: number;
  board:       MemCard[];
};

export type MemMatchOver = {
  winnerId:    string | null;
  winnerName:  string | null;
  scores:      Record<string, number>;
  totalRounds: number;
  forfeit?:    boolean;
  forfeitedBy?: string;
};

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

const TIMER_MS = 10_000;

export function useMemoryDuel({ roomId, myId, players }: Props) {
  const navigate = useNavigate();

  const [board, setBoard]             = useState<MemCard[]>([]);
  const [turnId, setTurnId]           = useState<string>("");
  const [pairs, setPairs]             = useState<Record<string, number>>({});
  const [scores, setScores]           = useState<Record<string, number>>(
    Object.fromEntries(players.map((p) => [p.id, 0]))
  );
  const [roundNumber, setRoundNumber] = useState<number>(0);
  const [phase, setPhase]             = useState<MemPhase>("pending");
  const [roundResult, setRoundResult] = useState<MemRoundResult | null>(null);
  const [matchOver, setMatchOver]     = useState<MemMatchOver | null>(null);
  const [timeLeft, setTimeLeft]       = useState<number>(TIMER_MS);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);

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
        `${BACKEND_URL}/api/rooms/${roomId}/forfeit`,
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
    socket.on("mem_round_start", () => {
      setPhase("playing");
      setRoundResult(null);
      setPairs({});
    });

    socket.on("mem_update", (data: {
      board:       MemCard[];
      turnId:      string;
      pairs:       Record<string, number>;
      scores:      Record<string, number>;
      roundNumber: number;
      revealCards:  { id: number; emoji: string }[] | null;
      reason:      string | null;
      timeLimit:   number;
    }) => {
      setBoard(data.board);
      setTurnId(data.turnId);
      setPairs(data.pairs);
      setScores(data.scores);
      setRoundNumber(data.roundNumber);
      setPhase("playing");
      startCountdown();
    });

    socket.on("mem_round_result", (data: MemRoundResult) => {
      stopCountdown();
      setBoard(data.board);
      setScores(data.scores);
      setPairs(data.pairs);
      setRoundNumber(data.roundNumber);
      setRoundResult(data);
      setPhase("round_over");
    });

    socket.on("mem_match_over", (data: MemMatchOver) => {
      stopCountdown();
      setMatchOver(data);
      setPhase("match_over");
    });

    return () => {
      socket.off("mem_round_start");
      socket.off("mem_update");
      socket.off("mem_round_result");
      socket.off("mem_match_over");
      stopCountdown();
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const flipCard = useCallback((cardId: number) => {
    if (phase !== "playing") return;
    if (turnId !== myId) return;
    socket.emit("mem_flip", { roomId, cardId });
  }, [phase, turnId, myId, roomId]);

  const requestEndMatch = useCallback(() => setShowConfirmEnd(true),  []);
  const confirmEndMatch = useCallback(() => {
    setShowConfirmEnd(false);
    socket.emit("mem_end_match", { roomId });
  }, [roomId]);
  const cancelEndMatch  = useCallback(() => setShowConfirmEnd(false), []);

  // ── Derived ────────────────────────────────────────────────────────────────

  const me       = players.find((p) => p.id === myId);
  const opponent = players.find((p) => p.id !== myId);
  const isMyTurn = turnId === myId;
  const myScore  = scores[myId] ?? 0;
  const oppScore = opponent ? (scores[opponent.id] ?? 0) : 0;
  const myPairs  = pairs[myId] ?? 0;
  const oppPairs = opponent ? (pairs[opponent.id] ?? 0) : 0;
  const timerPct = (timeLeft / TIMER_MS) * 100;

  return {
    board, roundNumber, phase, roundResult, matchOver,
    timeLeft, timerPct, isMyTurn, turnId,
    me, opponent, myScore, oppScore, myPairs, oppPairs,
    showConfirmEnd,
    flipCard, requestEndMatch, confirmEndMatch, cancelEndMatch,
  };
}
