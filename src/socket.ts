import { io, Socket } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const socket: Socket = io(BACKEND_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 30000,
});

export { BACKEND_URL };
export default socket;