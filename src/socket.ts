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
  timeout: 65000,   // 65 s > Render free-tier cold-start (~55 s)
});

// ── Server wake-up machinery ──────────────────────────────────────────────────
// Render free tier cold-starts take ~55 s.  We fire a lightweight GET /ping the
// moment the bundle loads so the server is warming up while the user is still on
// the landing page.  socket.connect() is called directly (not gated on this
// ping) — the 65 s timeout above is the safety net if the server is still cold.

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