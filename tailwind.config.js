/** @type {import('tailwindcss').Config} */
const channel = (name) => `rgb(var(--${name}) / <alpha-value>)`;

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
      // ─── Colour tokens (src/index.css) ──────────────────────────────────
      colors: {
        border: channel("border"),
        input: channel("input"),
        ring: channel("ring"),
        background: channel("background"),
        foreground: channel("foreground"),
        overlay: channel("overlay"),
        primary: { DEFAULT: channel("primary"), foreground: channel("primary-foreground") },
        secondary: { DEFAULT: channel("secondary"), foreground: channel("secondary-foreground") },
        destructive: { DEFAULT: channel("destructive"), foreground: channel("destructive-foreground") },
        muted: { DEFAULT: channel("muted"), foreground: channel("muted-foreground") },
        accent: { DEFAULT: channel("accent"), foreground: channel("accent-foreground") },
        popover: { DEFAULT: channel("popover"), foreground: channel("popover-foreground") },
        card: { DEFAULT: channel("card"), foreground: channel("card-foreground") },
        brand: { DEFAULT: channel("brand"), foreground: channel("brand-foreground"), ink: channel("brand-ink") },
        sign: { DEFAULT: channel("sign"), deep: channel("sign-deep") },
        road: channel("road"),
        paint: channel("paint"),
        vms: channel("vms"),
        "plate-red": channel("plate-red"),
        sidebar: {
          DEFAULT: channel("sidebar-background"),
          foreground: channel("sidebar-foreground"),
          border: channel("sidebar-border"),
          accent: channel("sidebar-accent"),
          "accent-foreground": channel("sidebar-accent-foreground"),
          primary: channel("sidebar-primary"),
          ring: channel("sidebar-ring"),
        },
        success: { DEFAULT: channel("success"), foreground: channel("success-foreground") },
        warning: { DEFAULT: channel("warning"), foreground: channel("warning-foreground") },
        info: { DEFAULT: channel("info"), foreground: channel("info-foreground") },
      },
      // Overpass (an open take on Highway Gothic) everywhere; DotGothic16 only
      // on the VMS board; JetBrains Mono only for code and simulator readouts.
      fontFamily: {
        sans: ['"Overpass Variable"', "Overpass", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        heading: ['"Overpass Variable"', "Overpass", "system-ui", "sans-serif"],
        body: ['"Overpass Variable"', "Overpass", "system-ui", "sans-serif"],
        vms: ["DotGothic16", "ui-monospace", "monospace"],
        mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-2xl": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.035em" }],
        "display-xl":  ["3.75rem", { lineHeight: "1.02", letterSpacing: "-0.035em" }],
        "display-lg":  ["3rem",    { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "display-md":  ["2.25rem", { lineHeight: "1.1",  letterSpacing: "-0.03em" }],
        "display-sm":  ["1.875rem",{ lineHeight: "1.15", letterSpacing: "-0.025em" }],
        "display-xs":  ["1.5rem",  { lineHeight: "1.2",  letterSpacing: "-0.02em" }],
      },
      minHeight: { touch: "48px" },
      minWidth: { touch: "48px" },
      // Controls 12px, cards 20px, the gantry sign and road 24px, pills round.
      borderRadius: {
        DEFAULT: "0.5rem",
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "1rem",
        "2xl": "var(--radius-panel)",
        "3xl": "var(--radius-hero)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "focus-ring": "0 0 0 3px rgb(var(--ring) / 0.35)",
        "card-hover": "var(--shadow-md)",
        sidebar: "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
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
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(4px)" },
        },
        "slide-in-right": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        "slide-out-right": { from: { transform: "translateX(0)" }, to: { transform: "translateX(100%)" } },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "spin-slow": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.22s var(--ease-out)",
        "accordion-up": "accordion-up 0.2s var(--ease-out)",
        "fade-in": "fade-in 0.2s var(--ease-out)",
        "fade-out": "fade-out 0.2s var(--ease-out)",
        "slide-in-right": "slide-in-right 0.32s var(--ease-out)",
        "slide-out-right": "slide-out-right 0.28s var(--ease-out)",
        "scale-in": "scale-in 0.18s var(--ease-out)",
        "spin-slow": "spin-slow 2s linear infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
