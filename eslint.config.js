// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const boundaries = /** @type {import('eslint').ESLint.Plugin} */ (
  require('eslint-plugin-boundaries')
);
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/root-path': __dirname,
      'boundaries/elements': [
        {
          type: 'electron',
          pattern: 'projects/electron',
          partialMatch: false,
        },
        {
          type: 'docs',
          pattern: 'projects/docs',
          partialMatch: false,
        },
      ],
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          checkAllOrigins: false,
          checkUnknownLocals: false,
          checkInternals: false,
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
