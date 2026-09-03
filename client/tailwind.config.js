/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B1D1A",
        paper: "#EDEEEA",
        panel: "#FFFFFF",
        sidebar: "#1B1D1A",
        accent: "#2C3E85",
        accentSoft: "#E4E7F3",
        line: "#D9D6C9",
        lineDark: "#33352F",
        muted: "#6E6B5C",
        mutedDark: "#9A9C93",
        // Tier identity colors -- reserved strictly for tier badges, kept
        // distinct from the accent so the accent stays a meaningful signal
        // for actions.
        silver: { DEFAULT: "#6B7078", soft: "#EEEFF1" },
        gold: { DEFAULT: "#9C7A26", soft: "#F6EFDC" },
        premium: { DEFAULT: "#5B3E8C", soft: "#EFEAF6" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Spectral", "Georgia", "serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
    },
  },
  plugins: [],
};
