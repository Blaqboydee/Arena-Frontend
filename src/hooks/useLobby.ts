import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { useSession } from "./useSession";
import type { GameType } from "../types";

export type LobbyPhase =
  | "idle"           // connected, browsing games
  | "queuing"        // in quick-match queue
  | "creating_room"  // created private room, waiting for friend
  | "joining_room"   // typing invite code
  | "match_found";   // about to navigate to game

export type QueueCounts = Partial<Record<GameType, number>>;

export function useLobby() {
  const navigate    = useNavigate();
  const { session } = useSession();

  const [phase, setPhase]             = useState<LobbyPhase>("idle");
  const [queueCounts, setQueueCounts] = useState<QueueCounts>({});
  const [queuedGame, setQueuedGame]   = useState<GameType | null>(null);
  const [inviteCode, setInviteCode]   = useState<string>("");
  const [inviteInput, setInviteInput] = useState<string>("");
  const [joinError, setJoinError]     = useState<string>("");
  const [roomId, setRoomId]           = useState<string | null>(null);

  // ── Socket lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return; // Guard: session must exist before connecting

    // Connect once — no-op if already connected
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("set_session", {
      name:        session.name,
      avatarColor: session.avatarColor,
    });

    // Subscribe to live lobby counts
    socket.emit("join_lobby");

    // ── Incoming events ────────────────────────────────────────────────────
    socket.on("lobby_counts", (counts: QueueCounts) => {
      setQueueCounts(counts);
    });

    socket.on("room_created", (data: { roomId: string; inviteCode: string }) => {
      setRoomId(data.roomId);
      setInviteCode(data.inviteCode);
      setPhase("creating_room");
    });

    socket.on("join_error", (data: { message: string }) => {
      setJoinError(data.message);
    });

    socket.on(
      "match_found",
      (data: { roomId: string; gameType: GameType; players: unknown[]; yourId: string }) => {
        setPhase("match_found");
        navigate(`/game/${data.roomId}`, {
          state: {
            gameType: data.gameType,
            players:  data.players,
            yourId:   data.yourId,
          },
        });
      }
    );

    return () => {
      // Unsubscribe lobby events only — do NOT disconnect.
      // The socket stays alive so /game/:roomId can reuse the same connection.
      socket.emit("leave_lobby");
      socket.off("lobby_counts");
      socket.off("room_created");
      socket.off("join_error");
      socket.off("match_found");
    };
  }, [session, navigate]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const findMatch = useCallback((gameType: GameType) => {
    setQueuedGame(gameType);
    setPhase("queuing");
    socket.emit("find_match", { gameType });
  }, []);

  const cancelMatch = useCallback(() => {
    socket.emit("cancel_match");
    setQueuedGame(null);
    setPhase("idle");
  }, []);

  const createRoom = useCallback((gameType: GameType) => {
    setQueuedGame(gameType);
    socket.emit("create_room", { gameType });
    // Phase will update to "creating_room" when server responds
  }, []);

  const joinRoom = useCallback(() => {
    const code = inviteInput.trim().toUpperCase();
    if (!code) return;
    setJoinError("");
    socket.emit("join_room", { inviteCode: code });
  }, [inviteInput]);

  const openJoinDialog = useCallback(() => {
    setInviteInput("");
    setJoinError("");
    setPhase("joining_room");
  }, []);

  const cancelPrivateRoom = useCallback(() => {
    setInviteCode("");
    setRoomId(null);
    setQueuedGame(null);
    setPhase("idle");
  }, []);

  return {
    phase,
    session,
    queueCounts,
    queuedGame,
    inviteCode,
    inviteInput,
    setInviteInput,
    joinError,
    roomId,
    findMatch,
    cancelMatch,
    createRoom,
    joinRoom,
    openJoinDialog,
    cancelPrivateRoom,
  };
}