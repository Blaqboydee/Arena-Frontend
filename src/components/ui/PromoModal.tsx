import { X } from "lucide-react";

type Props = {
  onClose: () => void;
};

export default function PromoModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-bg/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bracket-card bg-surface border border-border rounded-sm p-6 w-full max-w-sm flex flex-col gap-5 slide-up-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="rule-label w-40">
              <span>from the dev</span>
            </div>
            <h3 className="font-display text-2xl tracking-wide text-text mt-1">
              Enjoying Arena?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-dim hover:text-muted transition-colors mt-0.5 flex-shrink-0"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <p className="font-mono text-xs text-muted leading-5">
          Arena is a side project by{" "}
          <span className="text-amber">Blaqboydee</span>. If you had fun,
          check out more of my work — or star the repo so more people find it.
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-2">
          <a
            href="https://deoluadegoke.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="
              w-full flex items-center justify-center gap-2
              bg-amber text-bg font-display tracking-wide text-sm
              py-2.5 rounded-sm hover:bg-amber-dim transition-colors duration-150
            "
          >
            View Portfolio →
          </a>
          <a
            href="https://github.com/Blaqboydee/Arena-Frontend"
            target="_blank"
            rel="noopener noreferrer"
            className="
              w-full flex items-center justify-center gap-2
              border border-border rounded-sm bg-elevated
              font-mono text-[10px] tracking-widest uppercase text-muted
              py-2.5 hover:border-amber/40 hover:text-text transition-colors duration-150 group
            "
          >
            {/* GitHub icon */}
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-dim group-hover:text-amber transition-colors duration-150">
              <path d="M8 .25a7.75 7.75 0 0 0-2.45 15.1c.39.07.53-.17.53-.37v-1.32c-2.15.47-2.6-1.04-2.6-1.04-.35-.9-.86-1.13-.86-1.13-.7-.48.05-.47.05-.47.78.05 1.19.8 1.19.8.69 1.18 1.81.84 2.25.64.07-.5.27-.84.49-1.03-1.72-.2-3.52-.86-3.52-3.83 0-.85.3-1.54.8-2.08-.08-.2-.35-1 .08-2.07 0 0 .65-.21 2.13.8A7.4 7.4 0 0 1 8 3.97c.66 0 1.32.09 1.94.27 1.48-1.01 2.13-.8 2.13-.8.43 1.07.16 1.87.08 2.07.5.54.8 1.23.8 2.08 0 2.98-1.81 3.63-3.53 3.82.28.24.52.71.52 1.43v2.12c0 .2.14.45.54.37A7.75 7.75 0 0 0 8 .25Z" fill="currentColor"/>
            </svg>
            <span>★ Star on GitHub</span>
          </a>
        </div>

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="font-mono text-[10px] text-dim hover:text-muted tracking-widest uppercase transition-colors text-center"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
