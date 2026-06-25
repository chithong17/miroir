/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f8f9fa",
        ink: "#191c1d",
        muted: "#444748",
        line: "#c4c7c8",
        panel: "#ffffff",
        panelSoft: "#f3f4f5",
        tertiary: "#67558c",
        tertiarySoft: "#d2bcfb",
        secondarySoft: "#e2e2e2",
      },
      boxShadow: {
        glow: "0 20px 60px -10px rgba(198, 198, 198, 0.15), 0 10px 30px -5px rgba(210, 188, 251, 0.08)",
      },
      fontFamily: {
        sans: ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Syne", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        hero: "radial-gradient(circle at top left, rgba(210, 188, 251, 0.22), transparent 26%), radial-gradient(circle at bottom right, rgba(210, 188, 251, 0.16), transparent 28%), linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)",
      },
      animation: {
        "pulse-ring": "pulse-ring 3s infinite",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(210, 188, 251, 0.4)" },
          "70%": { boxShadow: "0 0 0 20px rgba(210, 188, 251, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(210, 188, 251, 0)" },
        },
      },
    },
  },
  plugins: [],
};
