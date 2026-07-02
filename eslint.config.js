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
    },
  },
])
