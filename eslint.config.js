import js from '@eslint/js';
import globals from 'globals';
// eslint-plugin-react-hooks 7 still ships a legacy-shaped configs['recommended-latest'];
// the flat namespace is the one flat config accepts.
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, reactHooks.configs.flat['recommended-latest']],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      // The `@/` alias is the only way across a folder boundary, so a relative
      // climb is always either a mistake or a file in the wrong place.
      'no-restricted-imports': ['error', { patterns: [{ group: ['../*'], message: 'Use the @/ alias to cross a folder boundary.' }] }],
    },
  },
);
