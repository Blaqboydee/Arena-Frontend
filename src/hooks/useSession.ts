import { useState } from "react";
import type { AvatarColor } from "../types";

export type Session = {
  name: string;
  avatarColor: AvatarColor;
  avatar?: string; // boring-avatars seed
};

const SESSION_KEY = "arena_session";

function load(): Session | null {
  try {
    // localStorage so a returning player keeps their profile across tabs/visits.
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function save(s: Session) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* storage blocked */ }
}

export function useSession() {
  const [session, setSessionState] = useState<Session | null>(load);

  function setSession(s: Session) {
    save(s);
    setSessionState(s);
  }

  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* storage blocked */ }
    setSessionState(null);
  }

  return { session, setSession, clearSession };
}