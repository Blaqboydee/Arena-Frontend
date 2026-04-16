import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket, { BACKEND_URL } from "../socket";
import type { Player } from "../types";

// ── Types ────────────────────────────────────────────────────────────────────

export type BombPhase = "pending" | "active" | "defused" | "exploded";
export type BombRole  = "defuser" | "expert";

export type WireModuleView = {
  type:      "wires";
  index:     number;
  solved:    boolean;
  // Defuser-only
  wires?:    string[];
  wireCount: number;
  // Expert-only
  rules?:    string[];
};

export type KeypadModuleView = {
  type:     "keypad";
  index:    number;
  solved:   boolean;
  // Defuser-only
  symbols?: string[];
  pressed?: string[];
  // Expert-only
  columns?: string[][];
};

export type SimonModuleView = {
  type:       "simon";
  index:      number;
  solved:     boolean;
  // Defuser-only
  sequence?:  string[];
  inputSoFar?: string[];
  // Expert-only
  colorMap?:  Record<string, string>;
  strikeCount?: number;
};

export type ModuleView = WireModuleView | KeypadModuleView | SimonModuleView;

export type BombResult = {
  success:   boolean;
  reason?:   string;
  timeUsed:  number;
  strikes:   number;
  players:   Player[];
};

type Props = {
  roomId:  string;
  myId:    string;
  players: Player[];
};

const TOTAL_TIME_MS = 120_000;

export function useBombDefusal({ roomId, myId, players }: Props) {
  const navigate = useNavigate();

  const [phase, setPhase]                 = useState<BombPhase>("pending");
  const [role, setRole]                   = useState<BombRole>("expert");
  const [defuserId, setDefuserId]         = useState<string>("");
  const [modules, setModules]             = useState<ModuleView[]>([]);
  const [strikes, setStrikes]             = useState<number>(0);
  const [maxStrikes, setMaxStrikes]       = useState<number>(2);
  const [currentModule, setCurrentModule] = useState<number>(0);
  const [result, setResult]               = useState<BombResult | null>(null);
  const [timeLeft, setTimeLeft]           = useState<number>(TOTAL_TIME_MS);
  const [activePlayers, setActivePlayers] = useState<Player[]>(players);
  const [strikeFlash, setStrikeFlash]     = useState(false);

  const timerStartRef = useRef<number>(0);
  const totalTimeRef  = useRef<number>(TOTAL_TIME_MS);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasBeenInGame = useRef(false);

  // ── Timer ──────────────────────────────────────────────────────────────────

  function startCountdown(remaining: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerStartRef.current = Date.now();
    totalTimeRef.current  = remaining;
    setTimeLeft(remaining);
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - timerStartRef.current;
      const left    = Math.max(0, totalTimeRef.current - elapsed);
      setTimeLeft(left);
      if (left === 0 && intervalRef.current) {
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
    if (phase === "active") hasBeenInGame.current = true;
  }, [phase]);

  useEffect(() => {
    if (phase !== "pending") return;
    if (hasBeenInGame.current) {
      navigate("/lobby", { replace: true });
      return;
    }
    const safeguardTimer = setTimeout(() => {
      if (!hasBeenInGame.current) navigate("/lobby", { replace: true });
    }, 8_000);
    return () => clearTimeout(safeguardTimer);
  }, [phase, navigate]);

  // ── Beforeunload beacon ────────────────────────────────────────────────────

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase !== "active") return;
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
    socket.on("bomb_start", (data: {
      role:        BombRole;
      defuserId:   string;
      timeLimit:   number;
      moduleCount: number;
      players:     Player[];
    }) => {
      setRole(data.role);
      setDefuserId(data.defuserId);
      setActivePlayers(data.players);
      setPhase("active");
    });

    socket.on("bomb_state", (data: {
      modules:       ModuleView[];
      strikes:       number;
      maxStrikes:    number;
      timeRemaining: number;
      phase:         string;
      currentModule: number;
      players:       Player[];
    }) => {
      setModules(data.modules);
      setStrikes(data.strikes);
      setMaxStrikes(data.maxStrikes);
      setCurrentModule(data.currentModule);
      setActivePlayers(data.players);
      if (data.phase === "active") {
        setPhase("active");
        startCountdown(data.timeRemaining);
      }
    });

    // Request current game state in case bomb_start/bomb_state were broadcast
    // before this component finished mounting and registered its listeners.
    socket.emit("bomb_request_state", { roomId });

    socket.on("bomb_strike", (data: {
      strikes:    number;
      maxStrikes: number;
      moduleIndex: number;
    }) => {
      setStrikes(data.strikes);
      setMaxStrikes(data.maxStrikes);
      setStrikeFlash(true);
      setTimeout(() => setStrikeFlash(false), 600);
    });

    socket.on("bomb_player_left", (data: {
      playerId:       string;
      players:        Player[];
      remainingCount: number;
    }) => {
      setActivePlayers(data.players);
    });

    socket.on("bomb_result", (data: BombResult) => {
      stopCountdown();
      setResult(data);
      setPhase(data.success ? "defused" : "exploded");
    });

    return () => {
      socket.off("bomb_start");
      socket.off("bomb_state");
      socket.off("bomb_strike");
      socket.off("bomb_player_left");
      socket.off("bomb_result");
      stopCountdown();
    };
  }, [roomId]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const cutWire = useCallback((moduleIndex: number, wireIndex: number) => {
    if (phase !== "active" || role !== "defuser") return;
    socket.emit("bomb_action", { roomId, moduleIndex, data: { wireIndex } });
  }, [phase, role, roomId]);

  const pressKeypad = useCallback((moduleIndex: number, symbol: string) => {
    if (phase !== "active" || role !== "defuser") return;
    socket.emit("bomb_action", { roomId, moduleIndex, data: { symbol } });
  }, [phase, role, roomId]);

  const pressSimon = useCallback((moduleIndex: number, color: string) => {
    if (phase !== "active" || role !== "defuser") return;
    socket.emit("bomb_action", { roomId, moduleIndex, data: { color } });
  }, [phase, role, roomId]);

  const requestEndMatch = useCallback(() => {
    socket.emit("bomb_end_match", { roomId });
  }, [roomId]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const me       = activePlayers.find((p) => p.id === myId);
  const isDefuser = role === "defuser";
  const timerPct = (timeLeft / TOTAL_TIME_MS) * 100;

  const defuserName = activePlayers.find((p) => p.id === defuserId)?.name ?? "Unknown";

  return {
    phase, role, isDefuser, defuserId, defuserName,
    modules, strikes, maxStrikes, currentModule,
    result, timeLeft, timerPct, activePlayers, strikeFlash,
    me,
    cutWire, pressKeypad, pressSimon, requestEndMatch,
  };
}
