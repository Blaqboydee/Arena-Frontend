import { useEffect, useState } from "react";
import socket from "../socket";
import type { GameResult, Player } from "../types";

export type ReactionPhase = "waiting" | "in_game" | "match_over";

type Props = {
  roomId: string;
  myId: string;
  players: Player[];
};

export function useReactionGame({ roomId, myId, players }: Props) {
  const [phase, setPhase]         = useState<ReactionPhase>("waiting");
  const [statusMsg, setStatusMsg] = useState("Get ready…");
  const [canClick, setCanClick]   = useState(false);
  const [flashGreen, setFlashGreen] = useState(false);
  const [scores, setScores]       = useState<Record<string, number>>(
    Object.fromEntries(players.map((p) => [p.id, 0]))
  );
  const [result, setResult]       = useState<GameResult | null>(null);
  const [roundResult, setRoundResult] = useState<GameResult | null>(null);

  useEffect(() => {
    socket.on("game_update", (data: { message: string; green?: boolean }) => {
      setStatusMsg(data.message);
      setRoundResult(null); // clear round banner on new round start

      const isGreen = !!data.green;
      setCanClick(isGreen);
      setFlashGreen(isGreen);

      if (isGreen) setPhase("in_game");
    });

    socket.on("game_result", (data: GameResult) => {
      setScores(data.scores);
      setCanClick(false);
      setFlashGreen(false);

      if (data.final) {
        setResult(data);
        setPhase("match_over");
      } else {
        setRoundResult(data);
        setStatusMsg("Round over…");
      }
    });

    return () => {
      socket.off("game_update");
      socket.off("game_result");
    };
  }, []);

  function sendClick() {
    if (!canClick) return;
    socket.emit("click", { roomId });
    setCanClick(false);
    setFlashGreen(false);
  }

  function getPlayerName(id: string): string {
    return players.find((p) => p.id === id)?.name ?? "Opponent";
  }

  const me       = players.find((p) => p.id === myId);
  const opponent = players.find((p) => p.id !== myId);
  const myScore       = scores[myId] ?? 0;
  const opponentScore = opponent ? (scores[opponent.id] ?? 0) : 0;

  return {
    phase,
    statusMsg,
    canClick,
    flashGreen,
    scores,
    result,
    roundResult,
    me,
    opponent,
    myScore,
    opponentScore,
    sendClick,
    getPlayerName,
  };
}