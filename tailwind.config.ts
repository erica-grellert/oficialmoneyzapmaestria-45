import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      xs: "380px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Meu Controle.AI Design Tokens - Yellow + Black Theme
        "mz-gold": {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#EAB308",
          600: "#CA8A04",
          700: "#A16207",
          800: "#854D0E",
          900: "#713F12",
        },
        "mz-yellow": {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#EAB308",
          600: "#CA8A04",
          700: "#A16207",
          800: "#854D0E",
          900: "#713F12",
        },
        "mz-black": {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        "mz-dark": {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        danger: {
          500: "#EF4444",
        },
        warn: {
          500: "#F59E0B",
        },
        info: {
          500: "#3B82F6",
        },

        // Manter compatibilidade
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "var(--mz-gold-600)",
          foreground: "#FFFFFF",
          50: "var(--mz-gold-50)",
          500: "var(--mz-gold-500)",
          600: "var(--mz-gold-600)",
          700: "var(--mz-gold-700)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "var(--danger-500)",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        "mz-card": "16px",
        "mz-modal": "20px",
        "mz-chip": "999px",
        // Manter compatibilidade
        lg: "16px",
        md: "12px",
        sm: "8px",
      },
      boxShadow: {
        "mz-card": "0 8px 24px rgba(15, 23, 42, 0.08)",
        "mz-card-hover": "0 16px 40px rgba(15, 23, 42, 0.10)",
        // Manter compatibilidade
        card: "0 8px 24px rgba(15, 23, 42, 0.08)",
        "card-hover": "0 16px 40px rgba(15, 23, 42, 0.10)",
      },
      backgroundImage: {
        "mz-gradient":
          "linear-gradient(135deg, var(--mz-gold-600) 0%, var(--mz-gold-500) 100%)",
      },
      fontSize: {
        "mz-hero": ["2.5rem", { lineHeight: "1.2", fontWeight: "700" }],
        "mz-title": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        "mz-body": ["1rem", { lineHeight: "1.5", fontWeight: "400" }],
        "mz-caption": ["0.875rem", { lineHeight: "1.4", fontWeight: "500" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
