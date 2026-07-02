import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // ─── React with SWC (fast refresh + transform) ───────────────────────
    react(),

    // ─── Progressive Web App ─────────────────────────────────────────────
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "favicon.png",
        "apple-touch-icon.png",
        "pwa-64x64.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "maskable-icon-512x512.png",
        "screenshot-wide.png",
        "screenshot-narrow.png",
      ],

      // Web App Manifest
      manifest: {
        id: "/",
        name: "DriveMy – JPJ KPP Theory & Driving Test",
        short_name: "DriveMy",
        description:
          "Bilingual (EN/BM) study companion for Malaysian learner drivers preparing for JPJ KPP1 theory exam and practical driving test.",
        lang: "en-MY",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
        ],
        screenshots: [
          {
            src: "screenshot-wide.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "DriveMy Dashboard",
          },
          {
            src: "screenshot-narrow.png",
            sizes: "750x1334",
            type: "image/png",
            form_factor: "narrow",
            label: "DriveMy on Mobile",
          },
        ],
        categories: ["education", "utilities"],
        shortcuts: [
          {
            name: "Theory Quiz",
            short_name: "Quiz",
            description: "Start a KPP1 theory practice quiz",
            url: "/quiz",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Road Signs",
            short_name: "Signs",
            description: "Browse Malaysian road signs",
            url: "/signs",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
        ],
      },

      // Workbox configuration
      workbox: {
        // Precache all JS, CSS, HTML, images, and fonts
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}"],

        // Runtime caching strategies
        runtimeCaching: [
          // Google Fonts stylesheets — StaleWhileRevalidate
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // Google Fonts files — CacheFirst (immutable)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Supabase API — NetworkFirst with fallback
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300, // 5 minutes
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          // Static assets — CacheFirst
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],

        // SPA navigation fallback — all navigation requests → index.html
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/supabase\//],

        // Prompt user for update instead of forcefully claiming clients
        skipWaiting: false,
        clientsClaim: false,
      },

      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],

  // ─── Path aliases ─────────────────────────────────────────────────────
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@stores": path.resolve(__dirname, "./src/stores"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@assets": path.resolve(__dirname, "./src/assets"),
    },
  },

  // ─── Build optimisation — manual chunk splitting ───────────────────────
  build: {
    target: "esnext",
    sourcemap: "hidden",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Phaser game engine — large, isolated
          if (id.includes("node_modules/phaser")) {
            return "vendor-phaser";
          }
          // Framer Motion chunk
          if (id.includes("framer-motion") || id.includes("motion")) {
            return "vendor-motion";
          }
          // PDF generation (only needed on specific pages)
          if (
            id.includes('jspdf') || 
            id.includes('jspdf-autotable') || 
            id.includes('html2canvas') || 
            id.includes('canvg') || 
            id.includes('dompurify') ||
            id.includes('pako') || 
            id.includes('fflate') || 
            id.includes('fast-png') || 
            id.includes('iobuffer')
          ) {
            return 'vendor-pdf';
          }
          // Charts (only needed on progress/analytics pages)
          if (
            id.includes('recharts') || 
            id.includes('d3-') || 
            id.includes('decimal.js')
          ) {
            return 'vendor-charts';
          }
          // Radix UI primitives (large, can be deferred)
          if (id.includes('@radix-ui')) {
            return 'radix';
          }
          // Supabase client (needed for auth but can be separate)
          if (id.includes('@supabase') || id.includes('phoenix') || id.includes('realtime-js')) {
            return 'supabase';
          }
          // React core (keep together, needed immediately)
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('@remix-run/router')) {
            return 'vendor-react';
          }
          // TanStack Query
          if (id.includes('@tanstack')) {
            return 'vendor-query';
          }
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    // Phaser + PDF vendor chunks are intentionally isolated and can exceed 600KB.
    // Raise warning threshold to reduce noise while preserving visibility for regressions.
    chunkSizeWarningLimit: 1300,
  },

  // ─── Dev server ───────────────────────────────────────────────────────────
  server: {
    port: 5173,
    strictPort: false,
    open: false,
    // Allow tunnel domains for mobile testing (localtunnel / ngrok / Cloudflare)
    allowedHosts: [".loca.lt", ".ngrok-free.app", ".ngrok.io", ".trycloudflare.com"],
  },

  // ─── Preview server ───────────────────────────────────────────────────────
  preview: {
    port: 4173,
    allowedHosts: [".loca.lt", ".ngrok-free.app", ".ngrok.io", ".trycloudflare.com"],
  },

  // ─── CSS ──────────────────────────────────────────────────────────────
  css: {
    devSourcemap: true,
  },

  // ─── Dependency pre-bundling ──────────────────────────────────────────
  optimizeDeps: {
    include: [
      "tslib",
      "@supabase/supabase-js",
      "react",
      "react-dom",
      "react-router-dom",
    ],
  },
});
