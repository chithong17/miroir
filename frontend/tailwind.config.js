/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#5A1E31",      /* Lighter deep burgundy background */
        canvasDeep: "#421322",  /* Even darker for contrast */
        canvasSoft: "#752842",  /* Lighter panels */
        ink: "#FDF2F4",         /* Main text color, off-white with pink hint */
        muted: "#DCA5B0",       /* Muted pink for secondary text */
        rose: "#EFA9B6",        /* Primary brand pink */
        roseBright: "#FFAFC0",  /* Hover state for pink */
        roseDeep: "#C07583",    /* Active/darker pink */
        glass: {
          light: "rgba(255, 255, 255, 0.1)",
          medium: "rgba(255, 255, 255, 0.15)",
          pink: "rgba(239, 169, 182, 0.15)",
        },
        border: {
          light: "rgba(255, 255, 255, 0.2)",
          pink: "rgba(239, 169, 182, 0.3)",
        }
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 8px 32px 0 rgba(239, 169, 182, 0.2)",
        glowDeep: "0 12px 48px 0 rgba(239, 169, 182, 0.35)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
};
