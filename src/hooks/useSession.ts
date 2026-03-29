import { useState } from "react";
import type { AvatarColor } from "../types";

export type Session = {
  name: string;
  avatarColor: AvatarColor;
};

const SESSION_KEY = "arena_session";

function load(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function save(s: Session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function useSession() {
  const [session, setSessionState] = useState<Session | null>(load);

  function setSession(s: Session) {
    save(s);
    setSessionState(s);
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    setSessionState(null);
  }

  return { session, setSession, clearSession };
}