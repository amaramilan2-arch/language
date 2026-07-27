import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

/**
 * Configuration volontairement légère.
 *
 * TypeScript en mode strict attrape déjà l'essentiel ; ESLint ne sert ici qu'à
 * ce que le compilateur ne voit pas. Une configuration bavarde produit du bruit
 * qu'on finit par ignorer, ce qui revient à ne pas avoir de linter du tout.
 */
export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.d.ts', 'e2e-screenshots/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      globals: { window: 'readonly', document: 'readonly', navigator: 'readonly', console: 'readonly' },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      // `no-unused-vars` de base donne des faux positifs sur les types TypeScript.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-undef': 'off', // le compilateur s'en charge, et mieux.
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'table'] }],
    },
  },
  {
    // Scripts et tests : ils tournent sous Node, où `process` et `console`
    // existent, et où afficher dans le terminal est le comportement attendu.
    files: ['**/*.test.ts', '**/e2e/**/*.mjs', '**/scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: { 'no-console': 'off' },
  },
];
