import { useState } from "react";
import Button from "./ui/Button";
import Card from "./ui/Card";

// ── Created Room Modal ─────────────────────────────────────────────────────────
type CreatedProps = {
  inviteCode: string;
  gameLabel: string;
  onCancel: () => void;
};

export function CreatedRoomModal({ inviteCode, gameLabel, onCancel }: CreatedProps) {
  const [copied, setCopied] = useState<"idle" | "code" | "link">("idle");

  const inviteLink = `${window.location.origin}/join/${inviteCode}`;

  function copyCode() {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCopied("code");
      setTimeout(() => setCopied("idle"), 2000);
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied("link");
      setTimeout(() => setCopied("idle"), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bg/80 backdrop-blur-sm">
      <Card brackets padded className="w-full max-w-sm flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] text-dim tracking-widest uppercase">
            Private Room
          </span>
          <h2 className="font-display text-3xl tracking-wide text-text">
            {gameLabel}
          </h2>
        </div>

        {/* Invite code */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] text-dim tracking-widest uppercase">
            Invite code
          </span>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-bg border border-border rounded-sm px-4 py-3 text-center">
              <span className="font-display text-4xl tracking-[0.3em] text-amber">
                {inviteCode}
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={copyCode}>
              {copied === "code" ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Invite link */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] text-dim tracking-widest uppercase">
            Or share link
          </span>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-bg border border-border rounded-sm px-3 py-2 overflow-hidden">
              <span className="font-mono text-[11px] text-muted truncate block">
                {inviteLink}
              </span>
            </div>
            <Button variant="primary" size="sm" onClick={copyLink}>
              {copied === "link" ? "Copied!" : "Copy link"}
            </Button>
          </div>
        </div>

        {/* Waiting indicator */}
        <div className="flex items-center gap-3 py-1">
          <div className="w-4 h-4 rounded-full border-2 border-border border-t-amber animate-spin shrink-0" />
          <span className="font-mono text-xs text-muted">
            Waiting for opponent to join…
          </span>
        </div>

        <Button variant="ghost" size="sm" fullWidth onClick={onCancel}>
          Cancel room
        </Button>
      </Card>
    </div>
  );
}

// ── Join Room Modal ────────────────────────────────────────────────────────────
type JoinProps = {
  value: string;
  onChange: (v: string) => void;
  onJoin: () => void;
  onCancel: () => void;
  error: string;
};

export function JoinRoomModal({ value, onChange, onJoin, onCancel, error }: JoinProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-bg/80 backdrop-blur-sm">
      <Card brackets padded className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] text-dim tracking-widest uppercase">
            Join Private Room
          </span>
          <h2 className="font-display text-3xl tracking-wide text-text">
            Enter code
          </h2>
        </div>

        <div className="flex flex-col gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && onJoin()}
            maxLength={6}
            placeholder="XXXXXX"
            autoFocus
            className="
              w-full bg-bg border border-border rounded-sm
              px-4 py-3 font-display text-3xl tracking-[0.3em]
              text-amber text-center placeholder-dim
              outline-none focus:border-amber/60
              transition-colors duration-150
            "
          />
          {error && (
            <p className="font-mono text-[11px] text-red text-center">{error}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" fullWidth onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" fullWidth onClick={onJoin}>
            Join
          </Button>
        </div>
      </Card>
    </div>
  );
}