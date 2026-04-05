import { Trophy, Skull, Handshake } from "lucide-react";
import type { Player } from "../../types";

type Props = {
  gameLabel:   string;
  winnerId:    string | null;
  myId:        string;
  players:     Player[];
  myScore:     number | string;
  oppScore:    number | string;
  totalRounds: number;
  tagline:     string;
  cardRef:     React.RefObject<HTMLDivElement | null>;
};

function CardAvatar({ name, color }: { name: string; color: string }) {
  const initials = name.slice(0, 2).toUpperCase();

  const palettes: Record<string, { bg: string; text: string; border: string }> = {
    amber: { bg: "#451a03",   text: "#fbbf24", border: "#92400e" },
    cyan:  { bg: "#083344",   text: "#22d3ee", border: "#0e7490" },
    green: { bg: "#052e16",   text: "#4ade80", border: "#166534" },
    red:   { bg: "#450a0a",   text: "#f87171", border: "#991b1b" },
    blue:  { bg: "#172554",   text: "#60a5fa", border: "#1e40af" },
    rose:    { bg: "#4c0519", text: "#fb7185", border: "#9f1239" },
    violet:  { bg: "#2e1065", text: "#a78bfa", border: "#5b21b6" },
    emerald: { bg: "#052e16", text: "#34d399", border: "#065f46" },
    sky:     { bg: "#082f49", text: "#38bdf8", border: "#0369a1" },
  };

  const p = palettes[color] ?? palettes.amber;

  return (
    <div style={{
      width: 56, height: 56, borderRadius: "50%",
      background: p.bg, border: `1.5px solid ${p.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Courier New', monospace",
      fontSize: 18, fontWeight: 700, color: p.text,
      letterSpacing: "0.05em", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export default function GameShareCard({
  gameLabel, winnerId, myId, players, myScore, oppScore, totalRounds, tagline, cardRef,
}: Props) {
  const iWon   = winnerId === myId;
  const isDraw  = winnerId === null;
  const me       = players.find((p) => p.id === myId);
  const opponent = players.find((p) => p.id !== myId);

  const accentColor = isDraw ? "#6b7280" : iWon ? "#f59e0b" : "#6b7280";
  const resultText  = isDraw ? "DRAW" : iWon ? "YOU WIN" : "YOU LOSE";

  const ResultIcon = isDraw
    ? <Handshake size={36} strokeWidth={1.25} color="#6b7280" />
    : iWon
    ? <Trophy    size={36} strokeWidth={1.25} color="#f59e0b" />
    : <Skull     size={36} strokeWidth={1.25} color="#6b7280" />;

  return (
    <div style={{ position: "fixed", top: -9999, left: -9999, zIndex: -1 }}>
      <div
        ref={cardRef}
        style={{
          width: 480,
          background: "#0a0a0a",
          border: "1px solid #1f1f1f",
          borderRadius: 8,
          padding: "40px 40px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          fontFamily: "'Courier New', monospace",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: 2, background: accentColor, opacity: 0.8,
        }} />

        {/* Corner brackets */}
        <div style={{
          position: "absolute", top: 12, left: 12,
          width: 16, height: 16,
          borderTop: `1px solid ${accentColor}`,
          borderLeft: `1px solid ${accentColor}`,
          opacity: 0.5,
        }} />
        <div style={{
          position: "absolute", bottom: 12, right: 12,
          width: 16, height: 16,
          borderBottom: `1px solid ${accentColor}`,
          borderRight: `1px solid ${accentColor}`,
          opacity: 0.5,
        }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {ResultIcon}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{
              fontSize: 28, fontWeight: 700, color: accentColor,
              letterSpacing: "0.12em", lineHeight: 1,
            }}>
              {resultText}
            </span>
            <span style={{ fontSize: 11, color: "#4b5563", letterSpacing: "0.08em" }}>
              {gameLabel.toUpperCase()} · {totalRounds} ROUND{totalRounds !== 1 ? "S" : ""}
            </span>
          </div>
        </div>

        {/* Score row */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          background: "#111", borderRadius: 6,
          padding: "20px 24px",
          border: "1px solid #1f1f1f",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <CardAvatar name={me?.name ?? "You"} color={me?.avatarColor ?? "amber"} />
            <span style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.05em" }}>
              {me?.name ?? "You"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              fontSize: 64, fontWeight: 700, lineHeight: 1,
              color: iWon ? "#f59e0b" : "#e5e7eb",
            }}>
              {myScore}
            </span>
            <span style={{ fontSize: 20, color: "#374151" }}>—</span>
            <span style={{
              fontSize: 64, fontWeight: 700, lineHeight: 1,
              color: !iWon && !isDraw ? "#f59e0b" : "#e5e7eb",
            }}>
              {oppScore}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <CardAvatar name={opponent?.name ?? "?"} color={opponent?.avatarColor ?? "cyan"} />
            <span style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.05em" }}>
              {opponent?.name ?? "Opponent"}
            </span>
          </div>
        </div>

        {/* Tagline + branding */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        }}>
          <span style={{ fontSize: 11, color: "#4b5563", fontStyle: "italic" }}>
            {tagline}
          </span>
          <span style={{
            fontSize: 11, color: "#374151",
            letterSpacing: "0.1em", fontWeight: 700,
          }}>
            ARENA ⚡ arenagameplay.vercel.app
          </span>
        </div>
      </div>
    </div>
  );
}
