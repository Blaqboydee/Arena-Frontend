import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import type { Player } from "../types";

export type TrivPhase = "pending" | "question" | "reveal" | "match_over";

export type TrivLeaderboardEntry = Player & { score: number };

export type TrivPlayerResult = {
  choice:  number | null;
  correct: boolean;
  points:  number;
};

export type TrivReveal = {
  questionNumber: number;
  correctAnswer:  number;
  question:       string;
  options:        string[];
  playerResults:  Record<string, TrivPlayerResult>;
  scores:         Record<string, number>;
  leaderboard:    TrivLeaderboardEntry[];
};

export type TrivMatchOver = {
  winnerId:       string | null;
  winnerName:     string | null;
  scores:         Record<string, number>;
  leaderboard:    TrivLeaderboardEntry[];
  totalQuestions:  number;
};

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

const TIMER_MS = 15_000;

export function useTriviaRoyale({ roomId, myId, players }: Props) {
  const navigate = useNavigate();

  const [phase, setPhase]                   = useState<TrivPhase>("pending");
  const [question, setQuestion]             = useState<string>("");
  const [options, setOptions]               = useState<string[]>([]);
  const [questionNumber, setQuestionNumber] = useState<number>(0);
  const [totalQuestions, setTotalQuestions]  = useState<number>(10);
  const [scores, setScores]                 = useState<Record<string, number>>({});
  const [leaderboard, setLeaderboard]       = useState<TrivLeaderboardEntry[]>([]);
  const [myChoice, setMyChoice]             = useState<number | null>(null);
  const [answeredCount, setAnsweredCount]   = useState<number>(0);
  const [reveal, setReveal]                 = useState<TrivReveal | null>(null);
  const [matchOver, setMatchOver]           = useState<TrivMatchOver | null>(null);
  const [timeLeft, setTimeLeft]             = useState<number>(TIMER_MS);
  const [activePlayers, setActivePlayers]   = useState<Player[]>(players);

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
    if (phase === "question" || phase === "reveal") {
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
    socket.on("triv_match_start", (data: {
      totalQuestions: number;
      playerCount:    number;
      players:        Player[];
    }) => {
      setTotalQuestions(data.totalQuestions);
      setActivePlayers(data.players);
    });

    socket.on("triv_question", (data: {
      questionNumber: number;
      totalQuestions:  number;
      question:        string;
      options:         string[];
      timeLimit:       number;
      scores:          Record<string, number>;
      players:         Player[];
    }) => {
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setQuestion(data.question);
      setOptions(data.options);
      setScores(data.scores);
      setMyChoice(null);
      setAnsweredCount(0);
      setReveal(null);
      setActivePlayers(data.players);
      setPhase("question");
      startCountdown();
    });

    socket.on("triv_player_answered", (data: {
      playerId:      string;
      answeredCount: number;
      totalPlayers:  number;
    }) => {
      setAnsweredCount(data.answeredCount);
    });

    socket.on("triv_reveal", (data: TrivReveal) => {
      stopCountdown();
      setReveal(data);
      setScores(data.scores);
      setLeaderboard(data.leaderboard);
      setPhase("reveal");
    });

    socket.on("triv_player_left", (data: {
      playerId:       string;
      players:        Player[];
      remainingCount: number;
    }) => {
      setActivePlayers(data.players);
    });

    socket.on("triv_match_over", (data: TrivMatchOver) => {
      stopCountdown();
      setMatchOver(data);
      setLeaderboard(data.leaderboard);
      setPhase("match_over");
    });

    return () => {
      socket.off("triv_match_start");
      socket.off("triv_question");
      socket.off("triv_player_answered");
      socket.off("triv_reveal");
      socket.off("triv_player_left");
      socket.off("triv_match_over");
      stopCountdown();
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const submitAnswer = useCallback((choice: number) => {
    if (phase !== "question" || myChoice !== null) return;
    setMyChoice(choice);
    socket.emit("triv_answer", { roomId, choice });
  }, [phase, myChoice, roomId]);

  const requestEndMatch = useCallback(() => {
    socket.emit("triv_end_match", { roomId });
  }, [roomId]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const me      = activePlayers.find((p) => p.id === myId);
  const myScore = scores[myId] ?? 0;
  const timerPct = (timeLeft / TIMER_MS) * 100;

  return {
    phase, question, options, questionNumber, totalQuestions,
    scores, leaderboard, myChoice, answeredCount, reveal,
    matchOver, timeLeft, timerPct, activePlayers,
    me, myScore,
    submitAnswer, requestEndMatch,
  };
}
