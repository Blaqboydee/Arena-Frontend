import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import type { Player } from "../types";

export type WyrPhase = "pending" | "choosing" | "revealed" | "match_over";

export type WyrQuestion = { a: string; b: string };

export type WyrReveal = {
  choices:     Record<string, "a" | "b">;
  question:    WyrQuestion;
  agreed:      boolean;
  agrees:      number;
  disagrees:   number;
  roundNumber: number;
};

export type WyrMatchOver = {
  totalRounds: number;
  agrees:      number;
  disagrees:   number;
  reason?:     string;
};

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

const TIMER_MS = 20_000;

export function useWouldYouRather({ roomId, myId, players }: Props) {
  const navigate = useNavigate();

  const [question, setQuestion]         = useState<WyrQuestion | null>(null);
  const [myChoice, setMyChoice]         = useState<"a" | "b" | null>(null);
  const [oppChose, setOppChose]         = useState(false);
  const [reveal, setReveal]             = useState<WyrReveal | null>(null);
  const [roundNumber, setRoundNumber]   = useState(0);
  const [agrees, setAgrees]             = useState(0);
  const [disagrees, setDisagrees]       = useState(0);
  const [phase, setPhase]               = useState<WyrPhase>("pending");
  const [matchOver, setMatchOver]       = useState<WyrMatchOver | null>(null);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [timeLeft, setTimeLeft]         = useState<number>(TIMER_MS);

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
    if (phase === "choosing" || phase === "revealed") {
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

  // ── Socket events ──────────────────────────────────────────────────────────

  useEffect(() => {
    socket.on("wyr_round_start", (data: {
      roundNumber: number;
      question:    WyrQuestion;
      agrees:      number;
      disagrees:   number;
    }) => {
      setQuestion(data.question);
      setMyChoice(null);
      setOppChose(false);
      setReveal(null);
      setRoundNumber(data.roundNumber);
      setAgrees(data.agrees);
      setDisagrees(data.disagrees);
      setPhase("choosing");
    });

    socket.on("wyr_timer", () => {
      startCountdown();
    });

    socket.on("wyr_player_chose", (data: { playerId: string }) => {
      if (data.playerId !== myId) {
        setOppChose(true);
      }
    });

    socket.on("wyr_reveal", (data: WyrReveal) => {
      stopCountdown();
      setReveal(data);
      setAgrees(data.agrees);
      setDisagrees(data.disagrees);
      setRoundNumber(data.roundNumber);
      setPhase("revealed");
    });

    socket.on("wyr_match_over", (data: WyrMatchOver) => {
      stopCountdown();
      setMatchOver(data);
      setPhase("match_over");
    });

    return () => {
      socket.off("wyr_round_start");
      socket.off("wyr_timer");
      socket.off("wyr_player_chose");
      socket.off("wyr_reveal");
      socket.off("wyr_match_over");
      stopCountdown();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const choose = useCallback((choice: "a" | "b") => {
    if (phase !== "choosing" || myChoice) return;
    setMyChoice(choice);
    socket.emit("wyr_choice", { roomId, choice });
  }, [phase, myChoice, roomId]);

  const requestEndMatch = useCallback(() => setShowConfirmEnd(true),  []);
  const confirmEndMatch = useCallback(() => {
    setShowConfirmEnd(false);
    socket.emit("wyr_end_match", { roomId });
  }, [roomId]);
  const cancelEndMatch  = useCallback(() => setShowConfirmEnd(false), []);

  // ── Derived ────────────────────────────────────────────────────────────────

  const me       = players.find((p) => p.id === myId);
  const opponent = players.find((p) => p.id !== myId);
  const timerPct = (timeLeft / TIMER_MS) * 100;

  return {
    question, myChoice, oppChose, reveal,
    roundNumber, agrees, disagrees,
    phase, matchOver, showConfirmEnd,
    timeLeft, timerPct,
    me, opponent,
    choose, requestEndMatch, confirmEndMatch, cancelEndMatch,
  };
}
