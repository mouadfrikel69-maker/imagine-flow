/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg:        "#08070d",
        surface:   "#0f0d18",
        elevated:  "#15131f",
        border:    "#26223a",
        accent:    "#a78bfa",   // violet-400
        accent2:   "#f472b6",   // pink-400
        accentSoft: "#7c3aed",
        success:   "#10b981",
        warning:   "#f59e0b",
        danger:    "#ef4444",
      },
      fontFamily: {
        mono: ["SpaceMono", "monospace"],
      },
    },
  },
  plugins: [],
};
