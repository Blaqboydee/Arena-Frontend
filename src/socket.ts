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

// ── Server wake-up machinery ──────────────────────────────────────────────────
// Render free tier cold-starts take ~55s, which exceeds the 30s socket timeout.
// Strategy: hit /ping (cheap HTTP) the moment the app loads so the cold-start
// clock begins immediately.  socket.connect() is only called after /ping
// resolves, guaranteeing the server is warm when the WebSocket handshake fires.

type WakeListener = () => void;
const _wakeListeners = new Set<WakeListener>();
let   _isWaking      = false;
let   _wakePromise: Promise<void> | null = null;

function _setWaking(v: boolean) {
  _isWaking = v;
  _wakeListeners.forEach((fn) => fn());
}

export function isServerWaking(): boolean { return _isWaking; }

export function onWakeChange(cb: WakeListener): () => void {
  _wakeListeners.add(cb);
  return () => _wakeListeners.delete(cb);
}

export function wakeServer(): Promise<void> {
  if (_wakePromise) return _wakePromise;

  // Local dev: no Render cold-starts, skip the ping
  if (!BACKEND_URL) {
    _wakePromise = Promise.resolve();
    return _wakePromise;
  }

  _setWaking(true);
  _wakePromise = fetch(`${BACKEND_URL}/ping`, {
    signal: AbortSignal.timeout(65_000),
  })
    .then(() => { /* server warm */ })
    .catch(() => { /* swallow — socket will surface the real error */ })
    .finally(() => _setWaking(false)) as Promise<void>;

  return _wakePromise;
}

// Fire immediately on module load — the cold-start clock starts ticking as
// soon as the app bundle is parsed, before the user even enters their name.
wakeServer();

export { BACKEND_URL };
export default socket;