import { io, Socket } from "socket.io-client";

const socket: Socket = io(import.meta.env.VITE_BACKEND_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
});

export default socket;