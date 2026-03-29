import { useEffect, useState } from "react";
import socket from "../socket";
import type { GameResult, GameUpdate, Player } from "../types";

type Phase = "enter_name" | "waiting" | "in_game" | "match_over";

export function useGameSocket() {
  const [phase, setPhase] = useState<Phase>("enter_name");
  const [myId, setMyId] = useState("");
  const [myName, setMyName] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [canClick, setCanClick] = useState(false);
  const [flashGreen, setFlashGreen] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      setMyId(socket.id ?? "");
    });

    socket.on(
      "match_found",
      (data: { roomId: string; players: Player[]; yourId: string }) => {
        setRoomId(data.roomId);
        setPlayers(data.players);
        setMyId(data.yourId);
        setStatusMsg("Match found! Get ready…");
        setPhase("in_game");
      }
    );

    socket.on("game_update", (data: GameUpdate) => {
      setStatusMsg(data.message);
      const isGreen = !!data.green;
      setCanClick(isGreen);
      setFlashGreen(isGreen);
    });

    socket.on("game_result", (data: GameResult) => {
      setResult(data);
      setScores(data.scores);
      setCanClick(false);
      setFlashGreen(false);

      if (data.final) {
        setPhase("match_over");
        setStatusMsg("Match Over");
      } else {
        setStatusMsg("Round over — next round soon…");
      }
    });

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, []);

  function joinQueue(name: string) {
    const trimmed = name.trim() || "Anonymous";
    setMyName(trimmed);
    socket.emit("set_name", trimmed);
    socket.emit("find_match");
    setPhase("waiting");
    setStatusMsg("Looking for an opponent…");
  }

  function sendClick() {
    if (!canClick || !roomId) return;
    socket.emit("click", { roomId });
    setCanClick(false);
    setFlashGreen(false);
  }

  function playAgain() {
    setResult(null);
    setScores({});
    setRoomId(null);
    setPlayers([]);
    setFlashGreen(false);
    setCanClick(false);
    setStatusMsg("");
    setPhase("enter_name");
  }

  return {
    phase,
    myId,
    myName,
    players,
    statusMsg,
    canClick,
    flashGreen,
    result,
    scores,
    joinQueue,
    sendClick,
    playAgain,
  };
}