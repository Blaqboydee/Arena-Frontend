import { useEffect, useState, useCallback } from "react";
import socket from "../socket";
import type { Player } from "../types";

export type TttPhase = "pending" | "playing" | "round_over" | "match_over";

export type TttRoundResult = {
  winnerId:   string | null;
  winnerName: string | null;
  reason:     "draw" | "timeout" | null;
  winLine:    number[] | null;
  board:      (string | null)[];
  scores:     Record<string, number>;
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
  const [board, setBoard]           = useState<(string | null)[]>(Array(9).fill(null));
  const [turnId, setTurnId]         = useState<string>("");
  const [mySymbol, setMySymbol]     = useState<string>("X");
  const [scores, setScores]         = useState<Record<string, number>>(
    Object.fromEntries(players.map((p) => [p.id, 0]))
  );
  const [phase, setPhase]           = useState<TttPhase>("pending");
  const [roundResult, setRoundResult] = useState<TttRoundResult | null>(null);
  const [matchOver, setMatchOver]   = useState<TttMatchOver | null>(null);
  const [timeLeft, setTimeLeft]     = useState<number>(TIMER_MS);
  const [timerKey, setTimerKey]     = useState<number>(0); // increment to reset timer

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return; // don't tick until round actually starts

    setTimeLeft(TIMER_MS);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [timerKey, phase]);

  // ── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    socket.on("ttt_update", (data: {
      board: (string | null)[];
      turnId: string;
      yourSymbol: string;
      scores: Record<string, number>;
      timeLimit: number;
    }) => {
      setBoard(data.board);
      setTurnId(data.turnId);
      setMySymbol(data.yourSymbol);
      setScores(data.scores);
      setPhase("playing");
      setRoundResult(null);
      setTimerKey((k) => k + 1); // reset countdown
    });

    socket.on("ttt_round_result", (data: TttRoundResult) => {
      setBoard(data.board);
      setScores(data.scores);
      setRoundResult(data);
      setPhase("round_over");
    });

    socket.on("ttt_match_over", (data: TttMatchOver) => {
      setMatchOver(data);
      setPhase("match_over");
    });

    return () => {
      socket.off("ttt_update");
      socket.off("ttt_round_result");
      socket.off("ttt_match_over");
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const makeMove = useCallback((cellIndex: number) => {
    if (phase !== "playing") return;
    if (turnId !== myId) return;
    if (board[cellIndex] !== null) return;

    socket.emit("ttt_move", { roomId, cellIndex });
  }, [phase, turnId, myId, board, roomId]);

  const endMatch = useCallback(() => {
    socket.emit("ttt_end_match", { roomId });
  }, [roomId]);

  const isMyTurn  = turnId === myId;
  const me        = players.find((p) => p.id === myId);
  const opponent  = players.find((p) => p.id !== myId);
  const myScore   = scores[myId] ?? 0;
  const oppScore  = opponent ? (scores[opponent.id] ?? 0) : 0;
  const timerPct  = (timeLeft / TIMER_MS) * 100;

  return {
    board,
    turnId,
    mySymbol,
    scores,
    phase,
    roundResult,
    matchOver,
    timeLeft,
    timerPct,
    isMyTurn,
    me,
    opponent,
    myScore,
    oppScore,
    makeMove,
    endMatch,
  };
}