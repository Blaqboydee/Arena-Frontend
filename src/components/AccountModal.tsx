import { useState } from "react";
import { createPortal } from "react-dom";
import Button from "./ui/Button";
import {
  claimAccount, restoreAccount,
  type RestoreResult,
} from "../socket";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "claim" | "restore";

type Props = {
  mode:        Mode;
  onClose:     () => void;
  /** Called after a successful restore with the recovered identity. */
  onRestored?: (identity: NonNullable<RestoreResult["identity"]>) => void;
  /** Called after a successful claim with the chosen username. */
  onClaimed?:  (username: string) => void;
};

const inputCls =
  "w-full bg-surface border border-border rounded-sm px-3 py-2.5 " +
  "font-mono text-[16px] sm:text-sm text-text placeholder-dim outline-none " +
  "focus:border-amber/60 transition-colors";

// ── Shell ─────────────────────────────────────────────────────────────────────

function Shell({ title, subtitle, onClose, children }: {
  title: string; subtitle: string; onClose: () => void; children: React.ReactNode;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-bg/95 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bracket-card bg-bg border border-border rounded-sm p-6 sm:p-7 w-full max-w-sm flex flex-col gap-5 slide-up-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="font-display text-2xl tracking-wide text-text">{title}</h3>
            <p className="font-mono text-[11px] text-muted leading-relaxed">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-dim hover:text-text transition-colors p-1 shrink-0"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AccountModal({ mode, onClose, onRestored, onClaimed }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Set on successful claim → switches to the recovery-code screen.
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleClaim() {
    setError(null);
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true);
    const res = await claimAccount(username.trim(), password);
    setBusy(false);
    if (!res.ok) { setError(res.error ?? "Could not save account."); return; }
    onClaimed?.(res.username ?? username.trim());
    setRecoveryCode(res.recoveryCode ?? "");
  }

  async function handleRestore() {
    setError(null);
    setBusy(true);
    const res = await restoreAccount(username.trim(), password);
    setBusy(false);
    if (!res.ok || !res.identity) { setError(res.error ?? "Could not restore account."); return; }
    onRestored?.(res.identity);
    onClose();
  }

  function copyCode() {
    if (!recoveryCode) return;
    navigator.clipboard?.writeText(recoveryCode).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1800); },
      () => { /* clipboard blocked — user can still read it */ },
    );
  }

  // ── Recovery-code success screen (after claim) ──────────────────────────────
  if (recoveryCode !== null) {
    return (
      <Shell
        title="Account saved ✓"
        subtitle="Save this recovery code somewhere safe — it's the only way back in if you forget your password."
        onClose={onClose}
      >
        <button
          onClick={copyCode}
          className="group flex items-center justify-center gap-3 w-full py-4 rounded-sm
                     border border-amber/40 bg-amber/10 hover:bg-amber/15 transition-colors"
          title="Tap to copy"
        >
          <span className="font-display text-lg sm:text-xl tracking-widest text-amber select-all">
            {recoveryCode}
          </span>
          <span className="font-mono text-[10px] text-dim uppercase tracking-wider shrink-0">
            {copied ? "copied" : "copy"}
          </span>
        </button>
        <p className="font-mono text-[10px] text-dim leading-relaxed">
          You can log in on any device with your username and password — or this code.
          We only show it once.
        </p>
        <Button variant="primary" size="md" fullWidth onClick={onClose}>
          Done
        </Button>
      </Shell>
    );
  }

  // ── Claim form ──────────────────────────────────────────────────────────────
  if (mode === "claim") {
    const ready = username.trim().length >= 3 && password.length >= 6 && confirm.length >= 6;
    return (
      <Shell
        title="Save your account"
        subtitle="Lock in your rank, stats and history so you can log in from any device."
        onClose={onClose}
      >
        <div className="flex flex-col gap-3">
          <Field label="Username">
            <input
              autoFocus value={username} maxLength={20}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="3–20 letters, numbers, _"
              className={inputCls}
            />
          </Field>
          <Field label="Password">
            <input
              type="password" value={password} maxLength={100}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className={inputCls}
            />
          </Field>
          <Field label="Confirm password">
            <input
              type="password" value={confirm} maxLength={100}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && ready && !busy) handleClaim(); }}
              placeholder="Re-enter password"
              className={inputCls}
            />
          </Field>
        </div>

        {error && <p className="font-mono text-[11px] text-red/90">{error}</p>}

        <Button variant="primary" size="md" fullWidth disabled={!ready || busy} onClick={handleClaim}>
          {busy ? "Saving…" : "Save account"}
        </Button>
      </Shell>
    );
  }

  // ── Restore form ────────────────────────────────────────────────────────────
  const ready = username.trim().length >= 3 && password.length >= 1;
  return (
    <Shell
      title="Restore account"
      subtitle="Log in to bring back your saved rank, stats and history on this device."
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <Field label="Username">
          <input
            autoFocus value={username} maxLength={20}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
            className={inputCls}
          />
        </Field>
        <Field label="Password or recovery code">
          <input
            type="password" value={password} maxLength={100}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && ready && !busy) handleRestore(); }}
            placeholder="Password or ARENA-XXXX-XXXX"
            className={inputCls}
          />
        </Field>
      </div>

      {error && <p className="font-mono text-[11px] text-red/90">{error}</p>}

      <Button variant="primary" size="md" fullWidth disabled={!ready || busy} onClick={handleRestore}>
        {busy ? "Restoring…" : "Restore account"}
      </Button>
    </Shell>
  );
}

// ── Field label wrapper ────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] text-dim tracking-widest uppercase">{label}</span>
      {children}
    </label>
  );
}
