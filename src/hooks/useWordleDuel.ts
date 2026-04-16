import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket, { BACKEND_URL } from "../socket";
import type { Player } from "../types";

export type WdlPhase = "pending" | "playing" | "round_over" | "match_over";

export type WdlGuess = {
  word:  string;
  grade: ("correct" | "present" | "absent")[];
};

export type WdlRoundResult = {
  winnerId:      string | null;
  winnerName:    string | null;
  answer:        string;
  scores:        Record<string, number>;
  roundNumber:   number;
  playerResults: Record<string, { guesses: WdlGuess[]; solved: boolean }>;
};

export type WdlMatchOver = {
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

const WORD_LENGTH  = 5;
const MAX_GUESSES  = 6;

export function useWordleDuel({ roomId, myId, players }: Props) {
  const navigate = useNavigate();

  const [guesses, setGuesses]           = useState<WdlGuess[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [solved, setSolved]             = useState(false);
  const [finished, setFinished]         = useState(false);
  const [scores, setScores]             = useState<Record<string, number>>(
    Object.fromEntries(players.map((p) => [p.id, 0]))
  );
  const [roundNumber, setRoundNumber]   = useState(0);
  const [phase, setPhase]               = useState<WdlPhase>("pending");
  const [roundResult, setRoundResult]   = useState<WdlRoundResult | null>(null);
  const [matchOver, setMatchOver]       = useState<WdlMatchOver | null>(null);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [invalidShake, setInvalidShake] = useState(false);
  const [toastMsg, setToastMsg]         = useState<string | null>(null);
  const [oppGuessCount, setOppGuessCount]   = useState(0);
  const [oppFinished, setOppFinished]       = useState(false);
  const [oppSolved, setOppSolved]           = useState(false);

  const hasBeenInGame = useRef(false);

  // ── Letter states (for keyboard coloring) ──────────────────────────────────

  const letterStates = useCallback((): Record<string, "correct" | "present" | "absent"> => {
    const states: Record<string, "correct" | "present" | "absent"> = {};
    for (const g of guesses) {
      for (let i = 0; i < WORD_LENGTH; i++) {
        const letter = g.word[i];
        const grade  = g.grade[i];
        const cur    = states[letter];
        // correct > present > absent
        if (grade === "correct") states[letter] = "correct";
        else if (grade === "present" && cur !== "correct") states[letter] = "present";
        else if (!cur) states[letter] = "absent";
      }
    }
    return states;
  }, [guesses]);

  // ── Navigation guards ──────────────────────────────────────────────────────

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
    socket.on("wdl_round_start", (data: {
      roundNumber: number;
      wordLength:  number;
      maxGuesses:  number;
      scores:      Record<string, number>;
    }) => {
      setGuesses([]);
      setCurrentGuess("");
      setSolved(false);
      setFinished(false);
      setScores(data.scores);
      setRoundNumber(data.roundNumber);
      setPhase("playing");
      setRoundResult(null);
      setOppGuessCount(0);
      setOppFinished(false);
      setOppSolved(false);
    });

    socket.on("wdl_update", (data: {
      guesses:       WdlGuess[];
      solved:        boolean;
      finished:      boolean;
      scores:        Record<string, number>;
      roundNumber:   number;
      oppGuessCount: number;
      oppFinished:   boolean;
      oppSolved:     boolean;
    }) => {
      setGuesses(data.guesses);
      setSolved(data.solved);
      setFinished(data.finished);
      setScores(data.scores);
      setRoundNumber(data.roundNumber);
      setOppGuessCount(data.oppGuessCount);
      setOppFinished(data.oppFinished);
      setOppSolved(data.oppSolved);
      setCurrentGuess("");
    });

    socket.on("wdl_invalid_word", () => {
      setInvalidShake(true);
      setToastMsg("Not a valid word");
      setTimeout(() => setInvalidShake(false), 600);
      setTimeout(() => setToastMsg(null), 2000);
    });

    socket.on("wdl_round_result", (data: WdlRoundResult) => {
      setRoundResult(data);
      setScores(data.scores);
      setRoundNumber(data.roundNumber);
      setPhase("round_over");
    });

    socket.on("wdl_match_over", (data: WdlMatchOver) => {
      setMatchOver(data);
      setPhase("match_over");
    });

    return () => {
      socket.off("wdl_round_start");
      socket.off("wdl_update");
      socket.off("wdl_invalid_word");
      socket.off("wdl_round_result");
      socket.off("wdl_match_over");
    };
  }, []);

  // ── Keyboard input ─────────────────────────────────────────────────────────

  const addLetter = useCallback((letter: string) => {
    if (phase !== "playing" || finished) return;
    setCurrentGuess((prev) => {
      if (prev.length >= WORD_LENGTH) return prev;
      return prev + letter.toLowerCase();
    });
  }, [phase, finished]);

  const removeLetter = useCallback(() => {
    if (phase !== "playing" || finished) return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, [phase, finished]);

  const submitGuess = useCallback(() => {
    if (phase !== "playing" || finished) return;
    if (currentGuess.length !== WORD_LENGTH) {
      setInvalidShake(true);
      setToastMsg("Not enough letters");
      setTimeout(() => setInvalidShake(false), 600);
      setTimeout(() => setToastMsg(null), 2000);
      return;
    }
    socket.emit("wdl_guess", { roomId, word: currentGuess });
  }, [phase, finished, currentGuess, roomId]);

  const requestEndMatch = useCallback(() => setShowConfirmEnd(true),  []);
  const confirmEndMatch = useCallback(() => {
    setShowConfirmEnd(false);
    socket.emit("wdl_end_match", { roomId });
  }, [roomId]);
  const cancelEndMatch  = useCallback(() => setShowConfirmEnd(false), []);

  // ── Derived ────────────────────────────────────────────────────────────────

  const me       = players.find((p) => p.id === myId);
  const opponent = players.find((p) => p.id !== myId);
  const myScore  = scores[myId] ?? 0;
  const oppScore = opponent ? (scores[opponent.id] ?? 0) : 0;

  return {
    guesses, currentGuess, solved, finished,
    scores, roundNumber, phase, roundResult, matchOver,
    showConfirmEnd, invalidShake, toastMsg,
    oppGuessCount, oppFinished, oppSolved,
    me, opponent, myScore, oppScore,
    letterStates, addLetter, removeLetter, submitGuess,
    requestEndMatch, confirmEndMatch, cancelEndMatch,
    wordLength: WORD_LENGTH, maxGuesses: MAX_GUESSES,
  };
}
