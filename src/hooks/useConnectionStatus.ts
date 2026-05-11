import { useEffect, useState } from "react";
import socket, { isServerWaking, onWakeChange } from "../socket";

export type ConnectionState = "connected" | "waking" | "reconnecting" | "disconnected";

function deriveState(): ConnectionState {
  if (socket.connected) return "connected";
  if (isServerWaking())  return "waking";
  return "disconnected";
}

export function useConnectionStatus(): ConnectionState {
  const [status, setStatus] = useState<ConnectionState>(deriveState);

  useEffect(() => {
    const onConnect          = () => setStatus("connected");
    const onDisconnect       = () => setStatus(deriveState());
    const onReconnectAttempt = () => setStatus("reconnecting");
    const onReconnectFailed  = () => setStatus("disconnected");
    const onWake             = () => setStatus(deriveState());

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect_failed", onReconnectFailed);
    const unsubWake = onWakeChange(onWake);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect_failed", onReconnectFailed);
      unsubWake();
    };
  }, []);

  return status;
}
