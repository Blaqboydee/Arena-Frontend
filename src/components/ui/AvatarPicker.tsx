import BoringAvatar from "boring-avatars";
import type { AvatarColor } from "../../types";
import { avatarPalette, AVATAR_SEEDS } from "../../lib/avatar";

type Props = {
  value: string;              // currently selected seed ("" = none)
  onChange: (seed: string) => void;
  color: AvatarColor;         // themes the preview avatars
};

export default function AvatarPicker({ value, onChange, color }: Props) {
  const palette = avatarPalette(color);

  return (
    <div className="grid grid-cols-6 gap-2">
      {AVATAR_SEEDS.map((seed) => {
        const active = value === seed;
        return (
          <button
            key={seed}
            type="button"
            onClick={() => onChange(seed)}
            title={seed}
            className={`rounded-sm overflow-hidden ring-2 transition-all duration-150 active:scale-90
              ${active ? "ring-amber" : "ring-transparent hover:ring-border-bright opacity-80 hover:opacity-100"}`}
          >
            <BoringAvatar size={44} name={seed} variant="beam" colors={palette} square />
          </button>
        );
      })}
    </div>
  );
}
