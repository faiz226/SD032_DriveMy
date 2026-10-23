import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts'],
    // Placeholder Supabase settings: src/lib/supabase.ts throws at import without them, CI sets none, and unit
    // tests must never reach a real project, whatever a developer's .env.local says (.invalid never resolves).
    env: { VITE_SUPABASE_URL: 'https://supabase.invalid', VITE_SUPABASE_ANON_KEY: 'test-anon-key' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
