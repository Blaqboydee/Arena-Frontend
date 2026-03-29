import { useRef, useState } from "react";

type Props = {
  onJoin: (name: string) => void;
};

export default function EnterName({ onJoin }: Props) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      {/* Logo mark */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-6xl leading-none">⚡</span>
        <h1 className="font-display text-7xl tracking-[10px] text-accent leading-none mt-1">
          REFLEX
        </h1>
        <p className="text-xs tracking-[3px] uppercase text-muted mt-1">
          1v1 Reaction Game
        </p>
      </div>

      {/* Input */}
      <div className="flex gap-2 w-full mt-4">
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onJoin(name)}
          maxLength={20}
          placeholder="Enter your name"
          autoFocus
          className="
            flex-1 bg-bg border border-border rounded-xl px-4 py-3
            text-text placeholder-muted text-sm outline-none
            focus:border-accent transition-colors duration-150
          "
        />
        <button
          onClick={() => onJoin(name)}
          className="
            bg-accent text-bg font-display text-lg tracking-widest
            px-6 py-3 rounded-xl
            hover:bg-accent-dim active:scale-95
            transition-all duration-150
          "
        >
          Play
        </button>
      </div>
    </div>
  );
}