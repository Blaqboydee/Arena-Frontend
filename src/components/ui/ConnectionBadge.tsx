import { useConnectionStatus, type ConnectionState } from "../../hooks/useConnectionStatus";

const config: Record<ConnectionState, { dot: string; label: string; text: string }> = {
  connected:    { dot: "bg-green",  label: "Connected",    text: "text-green" },
  reconnecting: { dot: "bg-amber",  label: "Reconnecting", text: "text-amber" },
  disconnected: { dot: "bg-red",    label: "Offline",      text: "text-red" },
};

export default function ConnectionBadge() {
  const status = useConnectionStatus();
  const { dot, label, text } = config[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        border rounded-sm px-2 py-0.5
        font-mono text-[10px] tracking-widest uppercase
        ${status === "connected"    ? "bg-green/10 border-green/30" : ""}
        ${status === "reconnecting" ? "bg-amber/10 border-amber/30" : ""}
        ${status === "disconnected" ? "bg-red/10   border-red/30"   : ""}
        ${text}
      `}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot} ${
          status === "reconnecting" ? "animate-pulse" : ""
        }`}
      />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
