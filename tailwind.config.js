/** @type {import('tailwindcss').Config} */
// DriveMy — "Jalan" design system. See DESIGN_SYSTEM.md.
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
      colors: {
        // ── Road palette, addressable directly where the semantic alias would
        //    obscure intent (a painted line is `awas`, not `accent`).
        asphalt: "rgb(var(--asphalt) / <alpha-value>)",
        concrete: "rgb(var(--concrete) / <alpha-value>)",
        paint: "rgb(var(--paint) / <alpha-value>)",
        awas: "rgb(var(--awas) / <alpha-value>)",
        berhenti: "rgb(var(--berhenti) / <alpha-value>)",
        lulus: "rgb(var(--lulus) / <alpha-value>)",
        "sign-info": "rgb(var(--sign-info) / <alpha-value>)",

        // Road surfaces
        road: {
          DEFAULT: "rgb(var(--surface-road) / <alpha-value>)",
          lane: "rgb(var(--surface-road-2) / <alpha-value>)",
          foreground: "rgb(var(--on-road) / <alpha-value>)",
          muted: "rgb(var(--on-road-muted) / <alpha-value>)",
        },

        // ── Semantic aliases (shadcn/ui contract) ─────────────────────────
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

      // ── Type ────────────────────────────────────────────────────────────
      // Barlow is the working family and does most of the talking: body,
      // labels, buttons, metadata. Archivo carries headings and figures only.
      // Barlow Condensed is the plate voice and is RESERVED FOR SIGNAGE — the
      // L/P plates and markings painted on the road. It is not a label face.
      //
      // This is an Operate surface. It had three families sharing the work
      // roughly evenly and 41% of its text set in condensed caps, at which
      // point the caps read as texture rather than as labels and the page lost
      // its quiet register entirely. See DESIGN_SYSTEM.md.
      fontFamily: {
        heading: ["Archivo", "system-ui", "sans-serif"],
        body:    ["Barlow", "system-ui", "sans-serif"],
        plate:   ['"Barlow Condensed"', '"Barlow"', "system-ui", "sans-serif"],
        mono:    ['"Barlow Condensed"', "ui-monospace", "monospace"],
        sans:    ["Barlow", "system-ui", "sans-serif"],
      },

      fontSize: {
        "display-2xl": ["4.5rem",  { lineHeight: "1.0",  letterSpacing: "-0.02em" }],
        "display-xl":  ["3.75rem", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "display-lg":  ["3rem",    { lineHeight: "1.05", letterSpacing: "-0.015em" }],
        "display-md":  ["2.25rem", { lineHeight: "1.08", letterSpacing: "-0.015em" }],
        "display-sm":  ["1.875rem",{ lineHeight: "1.12", letterSpacing: "-0.01em" }],
        "display-xs":  ["1.5rem",  { lineHeight: "1.16", letterSpacing: "-0.01em" }],
      },

      // ── Radius: three values, each with a reason ────────────────────────
      // Road geometry has almost no curves. Painted bays and rules are square;
      // informational plates take the small corner a JPJ plate has; `full` is
      // reserved for genuinely circular things.
      borderRadius: {
        none: "0px",
        bay:  "var(--r-bay)",
        sm:   "var(--r-plate)",
        DEFAULT: "var(--r-plate)",
        md:   "var(--r-plate)",
        lg:   "var(--r-plate)",
        xl:   "var(--r-plate)",
        "2xl": "var(--r-plate)",
        "3xl": "var(--r-plate)",
        full: "9999px",
      },

      minHeight: { touch: "48px" },
      minWidth:  { touch: "48px" },

      // ── Motion: only what earns its place ───────────────────────────────
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
          from: { opacity: "0", transform: "scale(0.97)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s cubic-bezier(0.22,1,0.36,1)",
        "accordion-up":    "accordion-up 0.2s cubic-bezier(0.22,1,0.36,1)",
        "fade-in":         "fade-in 0.2s cubic-bezier(0.22,1,0.36,1)",
        "fade-out":        "fade-out 0.15s ease-out",
        "slide-in-right":  "slide-in-right 0.3s cubic-bezier(0.32,0.72,0,1)",
        "slide-out-right": "slide-out-right 0.25s cubic-bezier(0.32,0.72,0,1)",
        "scale-in":        "scale-in 0.15s cubic-bezier(0.22,1,0.36,1)",
      },

      // Elevation is carried by kerbs and paint, not by drop shadows. Only the
      // genuinely floating surfaces (menus, drawers, dialogs) get a shadow.
      boxShadow: {
        plate:  "0 1px 0 0 rgb(var(--foreground) / 0.06)",
        float:  "0 8px 32px -8px rgb(var(--asphalt) / 0.28)",
        drawer: "-4px 0 32px -8px rgb(var(--asphalt) / 0.35)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
