import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'dev-dist',
    'lighthouse-report.html',
    '**/*.report.html',
    '.agents/**',
    '.claude/**',
    'reports/coverage/**',
    // Stray editor backups left at the repo root. Not imported by anything and
    // not valid UTF-8, so ESLint reports a parse error and fails the build.
    // These should be deleted outright — see the repo-hygiene item in TechStack.md.
    'backup_layout.tsx',
    'backup_layout*.txt',
    'graphify-out/**',
    // Vendored bklit chart source, installed and updated with
    // `npx shadcn add @bklit/<chart>`. It is upstream code: patching it to
    // satisfy the React Compiler hook rules would fork it. Our wrappers in
    // src/components/progress are linted as usual, and tsc still checks it.
    'src/components/charts/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Keep the core hooks rules, but avoid React Compiler-specific constraints
      // that are not part of the project's functional requirements.
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/incompatible-library': 'off',

      // The reskin work is visual-only; do not block on broad typing refactors.
      '@typescript-eslint/no-explicit-any': 'off',

      // Allow shared exports in shadcn/ui files.
      'react-refresh/only-export-components': 'off',

      // Do not block Phase 0 on style-adjacent warnings.
      'react-hooks/exhaustive-deps': 'off',
      'prefer-const': 'off',
      'no-useless-assignment': 'off',

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      // A debug `fetch('http://localhost:9999', ...)` once shipped to production
      // inside the error boundary, POSTing stack traces to every user's own
      // machine. Fail the build rather than rely on catching it in review.
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^https?:\\u002F\\u002F(localhost|127\\.0\\.0\\.1)/]",
          message:
            'Hardcoded localhost URL. Debug endpoints must never ship to production — read it from import.meta.env or remove the call.',
        },
      ],
    },
  },
])
