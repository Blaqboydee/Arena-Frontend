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

// ── Persistent guest identity ─────────────────────────────────────────────────
// A durable token (localStorage — survives reloads on the same device) lets the
// server resolve the same User row on every connect. The server mints one on
// first connect and pushes it back via the "identity" event, persisted below.
// This is additive and does NOT touch any of the locked transport/reconnection
// values above — it only adds a handshake `auth` payload.
const GUEST_TOKEN_KEY = "arena_guest_token";

export function getGuestToken(): string | null {
  try { return localStorage.getItem(GUEST_TOKEN_KEY); } catch { return null; }
}

function setGuestToken(token: string): void {
  try { localStorage.setItem(GUEST_TOKEN_KEY, token); } catch { /* storage blocked */ }
}

const USER_ID_KEY = "arena_user_id";
let _userId: string | null = (() => { try { return localStorage.getItem(USER_ID_KEY); } catch { return null; } })();
export function getUserId(): string | null { return _userId; }

// ── Claim status (is this device a saved account, and under what handle) ───────
// Persisted so the UI can render the right state before the socket reconnects.
const CLAIMED_KEY  = "arena_claimed";
const USERNAME_KEY = "arena_username";

export type AccountInfo = { claimed: boolean; username: string | null };

let _account: AccountInfo = {
  claimed:  (() => { try { return localStorage.getItem(CLAIMED_KEY) === "1"; } catch { return false; } })(),
  username: (() => { try { return localStorage.getItem(USERNAME_KEY); } catch { return null; } })(),
};

export function getAccount(): AccountInfo { return _account; }

const _accountListeners = new Set<() => void>();
export function onAccountChange(cb: () => void): () => void {
  _accountListeners.add(cb);
  return () => _accountListeners.delete(cb);
}

function setAccount(next: AccountInfo) {
  _account = next;
  try {
    localStorage.setItem(CLAIMED_KEY, next.claimed ? "1" : "0");
    if (next.username) localStorage.setItem(USERNAME_KEY, next.username);
    else localStorage.removeItem(USERNAME_KEY);
  } catch { /* storage blocked */ }
  _accountListeners.forEach((fn) => fn());
}

const socket: Socket = io(BACKEND_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 65000,   // 65 s > Render free-tier cold-start (~55 s)
  // Sent on every (re)connect; function form re-reads the latest stored token.
  auth: (cb) => cb({ token: getGuestToken() ?? undefined }),
});

// Server pushes the durable identity right after connect — persist it so the
// next connection (even after a reload) re-uses the same guest User. Also
// carries claim status (claimed / username), re-sent after claim or restore.
socket.on("identity", (data: {
  userId?: string; token?: string; claimed?: boolean; username?: string | null;
}) => {
  if (data?.token)  setGuestToken(data.token);
  if (data?.userId) {
    _userId = data.userId;
    try { localStorage.setItem(USER_ID_KEY, data.userId); } catch { /* storage blocked */ }
  }
  if (typeof data?.claimed === "boolean") {
    setAccount({ claimed: data.claimed, username: data.username ?? null });
  }
});

// ── Account claim / restore (ack-based request helpers) ───────────────────────

export type ClaimResult   = { ok: boolean; error?: string; username?: string; recoveryCode?: string };
export type RestoreResult = {
  ok: boolean; error?: string; viaRecovery?: boolean;
  identity?: { userId: string; token: string; name: string; avatarColor: string; avatar: string; username: string | null };
};

// Ensure the socket is connected, then emit with an ack and a timeout so the UI
// never hangs on a cold server.
function emitWithAck<T>(event: string, payload: unknown, timeoutMs = 20_000): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v: T) => { if (!settled) { settled = true; resolve(v); } };

    const timer = setTimeout(
      () => done({ ok: false, error: "The server took too long. Try again." } as unknown as T),
      timeoutMs,
    );

    const fire = () => socket.emit(event, payload, (res: T) => { clearTimeout(timer); done(res); });

    if (socket.connected) fire();
    else {
      socket.once("connect", fire);
      socket.connect();
    }
  });
}

export function claimAccount(username: string, password: string): Promise<ClaimResult> {
  return emitWithAck<ClaimResult>("claim_account", { username, password });
}

export function restoreAccount(username: string, password: string): Promise<RestoreResult> {
  return emitWithAck<RestoreResult>("restore_account", { username, password });
}

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