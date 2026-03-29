import type { AvatarColor } from "../../types";

const COLORS: { value: AvatarColor; hex: string; label: string }[] = [
  { value: "amber",   hex: "#F5A623", label: "Amber"   },
  { value: "cyan",    hex: "#22d3ee", label: "Cyan"    },
  { value: "rose",    hex: "#fb7185", label: "Rose"    },
  { value: "violet",  hex: "#a78bfa", label: "Violet"  },
  { value: "emerald", hex: "#34d399", label: "Emerald" },
  { value: "sky",     hex: "#38bdf8", label: "Sky"     },
];

type Props = {
  value: AvatarColor;
  onChange: (color: AvatarColor) => void;
};

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      {COLORS.map((c) => (
        <button
          key={c.value}
          title={c.label}
          onClick={() => onChange(c.value)}
          className={`
            w-7 h-7 rounded-sm transition-all duration-150
            ring-offset-2 ring-offset-bg
            ${value === c.value ? "ring-2 scale-110" : "opacity-50 hover:opacity-80"}
          `}
          style={{
            backgroundColor: c.hex,
            // ringColor: c.hex, // removed invalid CSS property
            // @ts-ignore
            "--tw-ring-color": c.hex,
          }}
        />
      ))}
    </div>
  );
}