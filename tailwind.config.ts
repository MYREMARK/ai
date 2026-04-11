import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#050816",
        foreground: "#f8fafc"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 10px 40px rgba(96,165,250,0.12)"
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top, rgba(59,130,246,0.18), transparent 34%), radial-gradient(circle at 75% 25%, rgba(168,85,247,0.18), transparent 24%), radial-gradient(circle at 30% 70%, rgba(34,211,238,0.12), transparent 28%)"
      }
    }
  },
  plugins: []
};

export default config;
