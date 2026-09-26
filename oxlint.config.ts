import { defineConfig } from 'oxlint';
import solidV2 from 'eslint-plugin-solid/configs/v2';

export default defineConfig({
  jsPlugins: ['eslint-plugin-solid'],
  ignorePatterns: ['**/*.gen.*', 'dist', 'android'],
  settings: solidV2.settings,
  // Type-aware rules (no-unsafe-*, no-floating-promises, ...) run through oxlint-tsgolint.
  options: {
    typeAware: true,
    reportUnusedDisableDirectives: 'error',
  },
  categories: {
    correctness: 'error',
    suspicious: 'error',
    perf: 'warn',
  },
  rules: {
    ...solidV2.rules,

    // Keep `any` and unchecked casts out; parse unknown data with valibot instead.
    'typescript/no-explicit-any': 'error',
    'typescript/no-non-null-assertion': 'error',
    'typescript/no-unsafe-type-assertion': 'error',
    'typescript/no-unnecessary-type-assertion': 'error',
    'typescript/no-unsafe-argument': 'error',
    'typescript/no-unsafe-assignment': 'error',
    'typescript/no-unsafe-call': 'error',
    'typescript/no-unsafe-member-access': 'error',
    'typescript/no-unsafe-return': 'error',

    // Control flow & nullish handling.
    'typescript/strict-boolean-expressions': 'error',
    'typescript/no-unnecessary-condition': 'error',
    'typescript/prefer-nullish-coalescing': 'error',
    'typescript/switch-exhaustiveness-check': 'error',

    // Promises.
    'typescript/no-floating-promises': 'error',
    'typescript/no-misused-promises': 'error',
    'typescript/await-thenable': 'error',
    'typescript/only-throw-error': 'error',

    'typescript/restrict-template-expressions': 'error',
    'typescript/consistent-type-imports': 'error',
    'typescript/no-deprecated': 'warn',
  },
  overrides: [
    {
      // Solid assigns `let el!: HTMLElement` refs through the `ref={el}` JSX attribute.
      files: ['**/*.tsx'],
      rules: { 'no-unassigned-vars': 'off' },
    },
  ],
});
