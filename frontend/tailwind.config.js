/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#E9EEF4",
        canvasDeep: "#DDE5EE",
        canvasSoft: "#EEF2F6",
        panel: "#EEF2F6",
        panelSoft: "#F4F6F9",
        elevated: "#D6E0EA",
        ink: "#10131A",
        muted: "#68707D",
        mutedSoft: "#8A93A1",
        line: "#D7DFE9",
        rose: "#74B9D8",
        roseBright: "#AEDFF2",
        roseDeep: "#4D94B2",
        accent: "#AEDFF2",
        accentStrong: "#74B9D8",
        accentSoft: "#E7F5FA",
        success: "#2D9D78",
        dangerSoft: "#FFE7E7",
        tertiary: "#74B9D8",
        tertiarySoft: "#AEDFF2",
        secondarySoft: "#E7F5FA",
        glass: {
          light: "rgba(255, 255, 255, 0.72)",
          medium: "rgba(255, 255, 255, 0.86)",
          pink: "rgba(231, 245, 250, 0.82)",
        },
        border: {
          light: "rgba(215, 223, 233, 0.9)",
          pink: "rgba(116, 185, 216, 0.38)",
        }
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 14px 32px -18px rgba(16, 19, 26, 0.32)",
        glowDeep: "0 24px 52px -28px rgba(16, 19, 26, 0.38)",
        glass: "0 18px 42px -24px rgba(16, 19, 26, 0.28)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
};
