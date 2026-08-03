import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";

// Sourcemap upload runs only when all three are present, so local and
// fork builds are unaffected. Set these in the Vercel project settings.
const SENTRY_ORG = process.env["SENTRY_ORG"];
const SENTRY_PROJECT = process.env["SENTRY_PROJECT"];
const SENTRY_AUTH_TOKEN = process.env["SENTRY_AUTH_TOKEN"];
const sentryUploadEnabled = Boolean(SENTRY_ORG && SENTRY_PROJECT && SENTRY_AUTH_TOKEN);

// https://vite.dev/config/
export default defineConfig({
  // Expose the build's release id to the client so Sentry.init() can tag
  // events with the same release the sourcemaps were uploaded under.
  define: {
    "import.meta.env.VITE_RELEASE": JSON.stringify(
      process.env["VERCEL_GIT_COMMIT_SHA"] ?? "dev"
    ),
  },

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
          // ─── Supabase ──────────────────────────────────────────────────
          //
          // This used to be a single catch-all rule matching every
          // *.supabase.co request, which put AUTHENTICATED REST responses —
          // one user's quiz results, mock scores and colour-vision results —
          // into a shared, unpartitioned cache. signOut() never cleared it, so
          // on a shared device (a driving school's tutorial PC, a family
          // tablet) the next person to sign in could be served the previous
          // user's data for the whole 5-minute TTL.
          //
          // Only two classes of Supabase response are cached now, and neither
          // is user-scoped.

          // 1. The question bank. Identical for every user, so a shared cache
          //    cannot leak anything between accounts — and caching it is what
          //    makes offline study actually work.
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/kpp_questions/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-questions",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day — question bank is static
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },

          // 2. Public storage objects (road-sign and Ishihara plate images).
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\//i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },

          // Everything else on supabase.co — user result tables, profiles and
          // all of /auth/v1/ — is deliberately NOT cached. Do not add a
          // catch-all rule back.
          // Static assets — CacheFirst
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-v3",
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

        // The 3D simulation vendor chunk (Three.js + Rapier physics) exceeds
        // the default 2 MiB precache limit. Raise it to 6 MiB so the build
        // succeeds. The large chunk is loaded lazily via dynamic import so
        // it does NOT block the initial page paint.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },

      devOptions: {
        enabled: true,
        type: "module",
      },
    }),

    // ─── Sentry sourcemap upload ─────────────────────────────────────────
    //
    // Without this, `sourcemap: "hidden"` below produced the worst of both
    // worlds: .map files were written into dist/ and served publicly by
    // Vercel (anyone guessing /assets/index-<hash>.js.map recovered the full
    // commented TypeScript source), while Sentry had no maps at all, so every
    // stack trace was unreadable minified noise.
    //
    // `filesToDeleteAfterUpload` removes the maps from the deployed output
    // once Sentry has them — traces stay readable, source stops shipping.
    ...(sentryUploadEnabled
      ? [
          sentryVitePlugin({
            org: SENTRY_ORG,
            project: SENTRY_PROJECT,
            authToken: SENTRY_AUTH_TOKEN,
            sourcemaps: {
              filesToDeleteAfterUpload: ["dist/**/*.map"],
            },
            release: {
              name: process.env["VERCEL_GIT_COMMIT_SHA"],
            },
            telemetry: false,
          }),
        ]
      : []),
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

    // Only generate sourcemaps when Sentry is configured to consume them.
    //
    // "hidden" omits the //# sourceMappingURL comment but STILL writes .map
    // files into dist/, which Vercel serves — anyone guessing
    // /assets/index-<hash>.js.map recovered the full commented TypeScript
    // source. When Sentry is configured the plugin uploads then deletes them
    // (filesToDeleteAfterUpload above); when it is not, emitting them at all
    // is pure downside, so don't.
    sourcemap: sentryUploadEnabled ? "hidden" : false,
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
