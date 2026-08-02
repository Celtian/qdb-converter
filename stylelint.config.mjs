import stylelint from 'stylelint';

const maxLinesRuleName = 'local/max-lines';
const maxLinesMessages = stylelint.utils.ruleMessages(maxLinesRuleName, {
  rejected: (actual, maximum) =>
    `File has too many lines (${actual}). Maximum allowed is ${maximum}.`,
});
const maxLinesPlugin = stylelint.createPlugin(maxLinesRuleName, (maximum) => {
  return (root, result) => {
    const source = root.source?.input.css ?? '';
    const lineCount = source
      ? source.split(/\r\n?|\n/u).length - (/(?:\r\n?|\n)$/u.test(source) ? 1 : 0)
      : 0;
    if (lineCount > maximum) {
      stylelint.utils.report({
        message: maxLinesMessages.rejected(lineCount, maximum),
        node: root,
        result,
        ruleName: maxLinesRuleName,
      });
    }
  };
});

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  plugins: [maxLinesPlugin],
  rules: {
    [maxLinesRuleName]: [150, { severity: 'error' }],
  },
  overrides: [
    {
      files: ['projects/*/src/styles.css', 'tailwind.theme.css'],
      rules: {
        'at-rule-no-unknown': [
          true,
          {
            ignoreAtRules: ['plugin', 'source', 'theme', 'utility'],
          },
        ],
        'import-notation': null,
      },
    },
    {
      files: ['**/*.component.css'],
      rules: {
        'selector-disallowed-list': [
          ['/^:host$/'],
          {
            message:
              'Use the Angular component decorator host property instead of a bare :host selector.',
            reportDisables: true,
          },
        ],
        'selector-max-type': [
          0,
          {
            message: 'Use classes or attributes instead of type selectors in component CSS.',
            reportDisables: true,
          },
        ],
      },
    },
  ],
};
