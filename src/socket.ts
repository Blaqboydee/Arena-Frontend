import { io, Socket } from "socket.io-client";

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  LOCKED CONFIG — DO NOT MODIFY                                             ║
// ║                                                                            ║
// ║  These settings were tuned to fix critical mobile connectivity issues:     ║
// ║  • withCredentials: required by server CORS credentials:true               ║
// ║  • transports: polling-first lets mobile connect before WS upgrade         ║
// ║  • reconnection / attempts / delay / timeout: tuned for Render cold starts ║
// ║                                                                            ║
// ║  Changing any value here WILL break mobile connections in production.       ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

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