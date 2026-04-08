import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-display)", "Archivo", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Archivo", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        whisper: {
          bg: "#050505",
          surface: "#111111",
          elevated: "#1a1a1a",
          border: "#2a2a2a",
        },
        brand: {
          yellow: "#FBBF24",
          orange: "#F97316",
          amber: "#F59E0B",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      borderWidth: {
        "3": "3px",
      },
      backgroundImage: {
        "dot-grid":
          "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        "grid-paper":
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        "hero-glow":
          "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(251,191,36,0.08) 0%, transparent 55%)",
        "card-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 55%)",
        "retro-amber":
          "linear-gradient(135deg, #FBBF24 0%, #F97316 100%)",
      },
      backgroundSize: {
        "dot-32": "32px 32px",
        "grid-40": "40px 40px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        flicker: {
          "0%, 95%, 100%": { opacity: "1" },
          "96%": { opacity: "0.8" },
          "97%": { opacity: "1" },
          "98%": { opacity: "0.6" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
        float: "float 6s ease-in-out infinite",
        scanline: "scanline 8s linear infinite",
        flicker: "flicker 6s infinite",
      },
      boxShadow: {
        // Legacy
        glow: "0 8px 40px rgba(251,191,36,0.15), 0 2px 8px rgba(0,0,0,0.4)",
        "glow-sm": "0 2px 16px rgba(251,191,36,0.12)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.35)",
        // Neobrutalist retro 3D shadows — strong & bold
        "retro-sm": "4px 4px 0px 0px #000",
        "retro-md": "6px 6px 0px 0px #000",
        "retro-lg": "8px 8px 0px 0px #000",
        "retro-xl": "10px 10px 0px 0px #000",
        // Amber-tinted retro shadows
        "retro-amber-sm": "4px 4px 0px 0px rgba(217,119,6,0.8)",
        "retro-amber-md": "6px 6px 0px 0px rgba(217,119,6,0.8)",
        // Card retro effect
        "retro-card": "6px 6px 0px 0px #000000",
        "retro-card-hover": "8px 8px 0px 0px #000000",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
