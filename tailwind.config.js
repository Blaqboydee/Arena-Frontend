/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core surfaces
        bg:              "#080809",
        surface:         "#0f0f11",
        elevated:        "#161618",
        border:          "#1e1e22",
        "border-bright": "#2e2e35",

        // Text
        text:  "#e8e8e8",
        muted: "#5a5a6a",
        dim:   "#3a3a48",

        // Accent — electric amber
        amber:      "#F5A623",
        "amber-dim":"#c4841c",
        "amber-glow":"rgba(245,166,35,0.15)",

        // Status
        green: "#3dffa0",
        red:   "#ff4d6d",
      },
      fontFamily: {
        display: ["Barlow Condensed", "sans-serif"],
        mono:    ["DM Mono", "monospace"],
      },
      keyframes: {
        flicker: {
          "0%,100%": { opacity: "1" },
          "92%":     { opacity: "1" },
          "93%":     { opacity: "0.6" },
          "94%":     { opacity: "1" },
          "96%":     { opacity: "0.8" },
          "97%":     { opacity: "1" },
        },
        "amber-pulse": {
          from: { boxShadow: "0 0 20px rgba(245,166,35,0.25)" },
          to:   { boxShadow: "0 0 48px rgba(245,166,35,0.55)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        flicker:       "flicker 4s infinite",
        "amber-pulse": "amber-pulse 1.2s ease infinite alternate",
        "slide-up":    "slide-up 0.5s ease forwards",
      },
    },
  },
  plugins: [],
}