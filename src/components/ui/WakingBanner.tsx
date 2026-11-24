import { useEffect, useState } from "react";
import { useConnectionStatus } from "../../hooks/useConnectionStatus";

// A full-width strip that explains the Render free-tier cold start. The tiny
// ConnectionBadge hides its label on mobile, so phone/iPad users otherwise see
// only a pulsing dot with no clue to wait — that's the #1 reason mobile
// "never connects" (iOS Safari freezes the tab mid-wait if you look away).
//
// Shows only while the server is waking / reconnecting / offline. An elapsed
// counter reassures users it's working, not frozen, through the ~55s boot.
export default function WakingBanner() {
  const status = useConnectionStatus();
  const [secs, setSecs] = useState(0);

  const active = status === "waking" || status === "reconnecting" || status === "disconnected";

  // Count up while we're waiting; reset whenever we leave the waiting state.
  useEffect(() => {
    if (!active) { setSecs(0); return; }
    setSecs(0);
    const id = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  if (!active) return null;

  const offline = status === "disconnected";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative z-20 border-b px-4 py-2.5 text-center ${
        offline
          ? "bg-red/10 border-red/30 text-red"
          : "bg-amber/10 border-amber/30 text-amber"
      }`}
    >
      <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 flex-wrap">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${
            offline ? "bg-red" : "bg-amber"
          }`}
        />
        <span className="font-mono text-[11px] sm:text-xs tracking-wide">
          {offline ? (
            <>Can’t reach the server. Retrying… <span className="opacity-70">({secs}s)</span></>
          ) : (
            <>
              Waking up the server — up to a minute on the first visit.
              <span className="hidden sm:inline"> </span>
              <span className="block sm:inline opacity-80">Keep this tab open.</span>
              <span className="opacity-60"> ({secs}s)</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
