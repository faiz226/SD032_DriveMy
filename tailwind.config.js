/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // ─── DriveMy Design Tokens ───────────────────────────────────────────
      colors: {
        // Semantic aliases mapped to CSS variables (shadcn/ui convention)
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        overlay: "rgb(var(--overlay) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        sidebar: {
          DEFAULT: "rgb(var(--sidebar-background) / <alpha-value>)",
          foreground: "rgb(var(--sidebar-foreground) / <alpha-value>)",
          border: "rgb(var(--sidebar-border) / <alpha-value>)",
          accent: "rgb(var(--sidebar-accent) / <alpha-value>)",
          "accent-foreground": "rgb(var(--sidebar-accent-foreground) / <alpha-value>)",
          primary: "rgb(var(--sidebar-primary) / <alpha-value>)",
          ring: "rgb(var(--sidebar-ring) / <alpha-value>)",
        },
        chart: {
          1: "rgb(var(--chart-1) / <alpha-value>)",
          2: "rgb(var(--chart-2) / <alpha-value>)",
          3: "rgb(var(--chart-3) / <alpha-value>)",
          4: "rgb(var(--chart-4) / <alpha-value>)",
          5: "rgb(var(--chart-5) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--success) / <alpha-value>)",
          foreground: "rgb(var(--success-foreground) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--warning) / <alpha-value>)",
          foreground: "rgb(var(--warning-foreground) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--info) / <alpha-value>)",
          foreground: "rgb(var(--info-foreground) / <alpha-value>)",
        },
      },
      fontFamily: {
        // Cal Sans for display headings when licensed; Inter 600 is the documented fallback
        heading: ['"Cal Sans"', '"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        body: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Fluid type scale
        "display-2xl": ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-xl":  ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg":  ["3rem",    { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-md":  ["2.25rem", { lineHeight: "1.2",  letterSpacing: "-0.02em" }],
        "display-sm":  ["1.875rem",{ lineHeight: "1.25", letterSpacing: "-0.01em" }],
        "display-xs":  ["1.5rem",  { lineHeight: "1.3",  letterSpacing: "-0.01em" }],
      },
      // ─── Spacing / Touch targets ─────────────────────────────────────────
      minHeight: {
        touch: "48px",   // WCAG 2.5.5 minimum touch target
      },
      minWidth: {
        touch: "48px",
      },
      // ─── Border radius (DESIGN.md) ───────────────────────────────────────
      // Small elements: 6px (rounded-md), cards/panels: 12px (rounded-xl), modals: 16px (rounded-2xl)
      // We keep Tailwind defaults for rounded-xl/2xl and pin shadcn defaults to 6px.
      borderRadius: {
        lg: "0.75rem",
        md: "var(--radius)",
        sm: "calc(var(--radius) - 2px)",
      },
      // ─── Animations ──────────────────────────────────────────────────────
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to:   { opacity: "0", transform: "translateY(4px)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(100%)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        "pulse-success": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.4)" },
          "50%":       { boxShadow: "0 0 0 8px rgba(16, 185, 129, 0)" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "fade-in":         "fade-in 0.2s ease-out",
        "fade-out":        "fade-out 0.2s ease-out",
        "slide-in-right":  "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
        "scale-in":        "scale-in 0.15s ease-out",
        "spin-slow":       "spin-slow 2s linear infinite",
        "pulse-success":   "pulse-success 1.5s ease-in-out infinite",
      },
      // ─── Box shadows ─────────────────────────────────────────────────────
      boxShadow: {
        "focus-ring": "0 0 0 3px hsl(var(--ring) / 0.5)",
        "card-hover": "0 4px 24px -4px rgba(0,0,0,0.12)",
        "sidebar":    "-4px 0 24px rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
