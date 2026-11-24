import { useEffect, useState } from "react";
import { getAccount, onAccountChange, getUserId } from "../socket";
import { fetchProfile } from "../lib/api";
import AccountModal from "./AccountModal";

// Tasteful, dismissible lobby prompt that asks ENGAGED guests (players with a
// real track record) to save their account — so their rank/stats don't vanish.
// Never shown to first-timers (gamesPlayed gate) or to claimed accounts, and it
// stays dismissed once closed.
const DISMISS_KEY = "arena_claim_nudge_dismissed";
const MIN_GAMES = 2;

function dismissed(): boolean {
  try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
}

export default function ClaimNudge() {
  const [account, setAccount] = useState(getAccount());
  const [show, setShow] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => onAccountChange(() => setAccount(getAccount())), []);

  useEffect(() => {
    if (account.claimed || dismissed()) { setShow(false); return; }
    const id = getUserId();
    if (!id) return;
    let cancelled = false;
    fetchProfile(id)
      .then((p) => { if (!cancelled && (p.user.gamesPlayed ?? 0) >= MIN_GAMES) setShow(true); })
      .catch(() => { /* no track record / offline — stay hidden */ });
    return () => { cancelled = true; };
  }, [account.claimed]);

  function close() {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* storage blocked */ }
    setShow(false);
  }

  if (account.claimed || !show) return null;

  return (
    <>
      <div className="w-full max-w-4xl slide-up-2 flex items-center gap-3 bg-amber/10 border border-amber/40 rounded-sm px-4 py-2.5">
        <span className="text-base shrink-0">🔒</span>
        <p className="font-mono text-[11px] text-muted flex-1 min-w-0 leading-relaxed">
          You're playing as a guest. <span className="text-text">Save your account</span> so your
          rank and stats survive clearing your browser or switching devices.
        </p>
        <button
          onClick={() => setOpenModal(true)}
          className="font-mono text-[10px] text-amber uppercase tracking-widest hover:underline shrink-0"
        >
          Save →
        </button>
        <button
          onClick={close}
          aria-label="Dismiss"
          className="text-dim hover:text-text transition-colors shrink-0 p-1"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {openModal && <AccountModal mode="claim" onClose={() => setOpenModal(false)} />}
    </>
  );
}
