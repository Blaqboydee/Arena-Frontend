import { useConnectionStatus, type ConnectionState } from "../../hooks/useConnectionStatus";

const config: Record<ConnectionState, { dot: string; label: string; text: string; bg: string }> = {
  connected:    { dot: "bg-green", label: "Connected",    text: "text-green", bg: "bg-green/10 border-green/30" },
  waking:       { dot: "bg-amber", label: "Waking...",    text: "text-amber", bg: "bg-amber/10 border-amber/30" },
  reconnecting: { dot: "bg-amber", label: "Reconnecting", text: "text-amber", bg: "bg-amber/10 border-amber/30" },
  disconnected: { dot: "bg-red",   label: "Offline",      text: "text-red",   bg: "bg-red/10   border-red/30"  },
};

export default function ConnectionBadge() {
  const status = useConnectionStatus();
  const { dot, label, text, bg } = config[status];
  const pulse = status === "waking" || status === "reconnecting";

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        border rounded-sm px-2 py-0.5
        font-mono text-[10px] tracking-widest uppercase
        ${bg} ${text}
      `}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot} ${
          pulse ? "animate-pulse" : ""
        }`}
      />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
