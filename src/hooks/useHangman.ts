import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import type { Player } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type HmPhase =
  | "pending"     // waiting for server start
  | "picking"     // setter is choosing a word
  | "guessing"    // guesser is guessing letters
  | "hint"        // setter must give a hint (1 limb left)
  | "round_over"  // round finished, showing result
  | "match_over"; // match done

export type HmRoundResult = {
  winnerId:    string | null;
  winnerName:  string | null;
  reason:      "guessed" | "hanged" | "timeout" | "pick_timeout" | "no_hint" | null;
  word:        string;
  wrongCount:  number;
  scores:      Record<string, number>;
  roundNumber: number;
  maxWrong:    number;
  setterId:    string;
  guesserId:   string;
};

export type HmMatchOver = {
  winnerId:    string | null;
  winnerName:  string | null;
  scores:      Record<string, number>;
  totalRounds: number;
  reason?:     string;
};

export type HmGuessResult = {
  letter:     string | null;
  correct:    boolean;
  wrongCount: number;
  bodyParts:  string[];
  reason?:    string;
};

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

export function useHangman({ roomId, myId, players }: Props) {
  const navigate = useNavigate();

  // ── Core state ─────────────────────────────────────────────────────────────

  const [phase, setPhase]                   = useState<HmPhase>("pending");
  const [maskedWord, setMaskedWord]         = useState<string[]>([]);
  const [wordLength, setWordLength]         = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongCount, setWrongCount]         = useState(0);
  const [maxWrong, setMaxWrong]             = useState(7);
  const [bodyParts, setBodyParts]           = useState<string[]>([]);
  const [scores, setScores]                 = useState<Record<string, number>>(
    Object.fromEntries(players.map((p) => [p.id, 0]))
  );
  const [roundNumber, setRoundNumber] = useState(0);
  const [setterId, setSetterId]       = useState("");
  const [guesserId, setGuesserId]     = useState("");
  const [hint, setHint]               = useState<string | null>(null);
  const [word, setWord]               = useState<string | null>(null); // setter only

  // ── UI state ───────────────────────────────────────────────────────────────

  const [roundResult, setRoundResult]       = useState<HmRoundResult | null>(null);
  const [matchOver, setMatchOver]           = useState<HmMatchOver | null>(null);
  const [lastGuess, setLastGuess]           = useState<HmGuessResult | null>(null);
  const [pickError, setPickError]           = useState("");
  const [hintError, setHintError]           = useState("");
  const [timeLeft, setTimeLeft]             = useState(0);
  const [timeLimit, setTimeLimit]           = useState(15_000);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);

  const timerStartRef = useRef(0);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasBeenInGame = useRef(false);

  // ── Timer ──────────────────────────────────────────────────────────────────

  function startCountdown(durationMs: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerStartRef.current = Date.now();
    setTimeLimit(durationMs);
    setTimeLeft(durationMs);

    intervalRef.current = setInterval(() => {
      const elapsed   = Date.now() - timerStartRef.current;
      const remaining = Math.max(0, durationMs - elapsed);
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

  // ── Mark game as live ──────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "pending" && phase !== "match_over") {
      hasBeenInGame.current = true;
    }
  }, [phase]);

  // ── Stale-pending guard ────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "pending") return;
    if (hasBeenInGame.current) {
      navigate("/lobby", { replace: true });
      return;
    }

    const safeguardTimer = setTimeout(() => {
      if (!hasBeenInGame.current) {
        navigate("/lobby", { replace: true });
      }
    }, 4_000);

    return () => clearTimeout(safeguardTimer);
  }, [phase, navigate]);

  // ── beforeunload beacon ────────────────────────────────────────────────────

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase === "pending" || phase === "match_over") return;

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
    // Round start — setter picks a word
    socket.on("hm_pick_word", (data: {
      setterId:    string;
      guesserId:   string;
      roundNumber: number;
      scores:      Record<string, number>;
      players:     Player[];
      timeLimit:   number;
    }) => {
      setSetterId(data.setterId);
      setGuesserId(data.guesserId);
      setRoundNumber(data.roundNumber);
      setScores(data.scores);
      setPhase("picking");
      setRoundResult(null);
      setLastGuess(null);
      setPickError("");
      setHintError("");
      setMaskedWord([]);
      setWordLength(0);
      setGuessedLetters([]);
      setWrongCount(0);
      setBodyParts([]);
      setHint(null);
      setWord(null);
      startCountdown(data.timeLimit);
    });

    // Game state update
    socket.on("hm_update", (data: {
      maskedWord:     string[];
      wordLength:     number;
      guessedLetters: string[];
      wrongCount:     number;
      maxWrong:       number;
      bodyParts:      string[];
      phase:          string;
      setterId:       string;
      guesserId:      string;
      scores:         Record<string, number>;
      roundNumber:    number;
      hint:           string | null;
      timeLimit:      number;
      word:           string | null;
    }) => {
      setMaskedWord(data.maskedWord);
      setWordLength(data.wordLength);
      setGuessedLetters(data.guessedLetters);
      setWrongCount(data.wrongCount);
      setMaxWrong(data.maxWrong);
      setBodyParts(data.bodyParts);
      setSetterId(data.setterId);
      setGuesserId(data.guesserId);
      setScores(data.scores);
      setRoundNumber(data.roundNumber);
      setHint(data.hint);
      setWord(data.word);

      if (data.phase === "hint") {
        setPhase("hint");
        startCountdown(data.timeLimit);
      } else if (data.phase === "guessing") {
        setPhase("guessing");
        startCountdown(data.timeLimit);
      }
    });

    // Individual guess result (for animations)
    socket.on("hm_guess_result", (data: HmGuessResult) => {
      setLastGuess(data);
      setWrongCount(data.wrongCount);
      setBodyParts(data.bodyParts);
    });

    // Pick error
    socket.on("hm_pick_error", (data: { message: string }) => {
      setPickError(data.message);
    });

    // Hint error
    socket.on("hm_hint_error", (data: { message: string }) => {
      setHintError(data.message);
    });

    // Round result
    socket.on("hm_round_result", (data: HmRoundResult) => {
      stopCountdown();
      setRoundResult(data);
      setScores(data.scores);
      setRoundNumber(data.roundNumber);
      setPhase("round_over");
    });

    // Match over
    socket.on("hm_match_over", (data: HmMatchOver) => {
      stopCountdown();
      setMatchOver(data);
      setPhase("match_over");
    });

    return () => {
      socket.off("hm_pick_word");
      socket.off("hm_update");
      socket.off("hm_guess_result");
      socket.off("hm_pick_error");
      socket.off("hm_hint_error");
      socket.off("hm_round_result");
      socket.off("hm_match_over");
      stopCountdown();
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const submitWord = useCallback((w: string) => {
    if (phase !== "picking")  return;
    if (setterId !== myId)    return;
    setPickError("");
    socket.emit("hm_submit_word", { roomId, word: w });
  }, [phase, setterId, myId, roomId]);

  const guessLetter = useCallback((letter: string) => {
    if (phase !== "guessing") return;
    if (guesserId !== myId)   return;
    const ch = letter.toUpperCase();
    if (guessedLetters.includes(ch)) return;
    socket.emit("hm_guess", { roomId, letter: ch });
  }, [phase, guesserId, myId, guessedLetters, roomId]);

  const giveHint = useCallback((h: string) => {
    if (phase !== "hint")     return;
    if (setterId !== myId)    return;
    setHintError("");
    socket.emit("hm_give_hint", { roomId, hint: h });
  }, [phase, setterId, myId, roomId]);

  const requestEndMatch = useCallback(() => setShowConfirmEnd(true),  []);
  const confirmEndMatch = useCallback(() => {
    setShowConfirmEnd(false);
    socket.emit("hm_end_match", { roomId });
  }, [roomId]);
  const cancelEndMatch  = useCallback(() => setShowConfirmEnd(false), []);

  // ── Derived ────────────────────────────────────────────────────────────────

  const isSetter     = setterId === myId;
  const isGuesser    = guesserId === myId;
  const me           = players.find((p) => p.id === myId);
  const opponent     = players.find((p) => p.id !== myId);
  const myScore      = scores[myId] ?? 0;
  const oppScore     = opponent ? (scores[opponent.id] ?? 0) : 0;
  const timerPct     = timeLimit > 0 ? (timeLeft / timeLimit) * 100 : 0;

  return {
    phase, maskedWord, wordLength, guessedLetters,
    wrongCount, maxWrong, bodyParts, scores, roundNumber,
    setterId, guesserId, hint, word,
    roundResult, matchOver, lastGuess,
    pickError, hintError,
    timeLeft, timeLimit, timerPct,
    isSetter, isGuesser,
    me, opponent, myScore, oppScore,
    showConfirmEnd,
    submitWord, guessLetter, giveHint,
    requestEndMatch, confirmEndMatch, cancelEndMatch,
  };
}
