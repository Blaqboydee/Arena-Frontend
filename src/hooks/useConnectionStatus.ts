import { useEffect, useState } from "react";
import socket from "../socket";

export type ConnectionState = "connected" | "reconnecting" | "disconnected";

export function useConnectionStatus(): ConnectionState {
  const [status, setStatus] = useState<ConnectionState>(
    socket.connected ? "connected" : "disconnected",
  );

  useEffect(() => {
    const onConnect = () => setStatus("connected");

    const onDisconnect = () => setStatus("disconnected");

    const onReconnectAttempt = () => setStatus("reconnecting");

    const onReconnectFailed = () => setStatus("disconnected");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect_failed", onReconnectFailed);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect_failed", onReconnectFailed);
    };
  }, []);

  return status;
}
