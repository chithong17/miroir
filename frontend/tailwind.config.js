/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        white: "#FFFFFF",
        mintDeep: "#94B16F",
        mint: "#B3D07E",
        mintSoft: "#BEDA9D",
        mintPale: "#E4F1D7",
        canvas: "#FFFFFF",
        canvasDeep: "#E4F1D7",
        canvasSoft: "#E4F1D7",
        panel: "#FFFFFF",
        panelSoft: "#E4F1D7",
        elevated: "#BEDA9D",
        ink: "#111111",
        muted: "#4B4B4B",
        mutedSoft: "#6B6B6B",
        line: "#BEDA9D",
        rose: "#B3D07E",
        roseBright: "#BEDA9D",
        roseDeep: "#94B16F",
        accent: "#B3D07E",
        accentStrong: "#94B16F",
        accentSoft: "#E4F1D7",
        success: "#94B16F",
        dangerSoft: "#FFE7E7",
        tertiary: "#B3D07E",
        tertiarySoft: "#BEDA9D",
        secondarySoft: "#E4F1D7",
        slate: {
          50: "#FFFFFF",
          100: "#E4F1D7",
          200: "#BEDA9D",
          300: "#B3D07E",
          400: "#94B16F",
          500: "#6B6B6B",
          600: "#4B4B4B",
          700: "#333333",
          800: "#222222",
          900: "#111111",
          950: "#000000",
        },
        green: {
          50: "#E4F1D7",
          100: "#E4F1D7",
          200: "#BEDA9D",
          700: "#4B5D38",
        },
        emerald: {
          50: "#E4F1D7",
          200: "#BEDA9D",
          300: "#B3D07E",
          700: "#4B5D38",
        },
        sky: {
          300: "#B3D07E",
        },
        glass: {
          light: "rgba(255, 255, 255, 0.72)",
          medium: "rgba(255, 255, 255, 0.86)",
          pink: "rgba(228, 241, 215, 0.82)",
        },
        border: {
          light: "rgba(190, 218, 157, 0.9)",
          pink: "rgba(148, 177, 111, 0.38)",
        }
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 14px 32px -18px rgba(47, 56, 40, 0.28)",
        glowDeep: "0 24px 52px -28px rgba(47, 56, 40, 0.34)",
        glass: "0 18px 42px -24px rgba(47, 56, 40, 0.24)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
};
