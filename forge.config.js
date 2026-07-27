const { version } = require('./package.json');

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'QDB Converter',
    icon: 'resources/icons/qdb-converter.ico',
    ignore: [
      /^\/examples/,
      /^\/projects/,
      /^\/tools/,
      /^\/\.git/,
      /^\/\.angular/,
      /^\/coverage/,
      /^\/out/,
      /^\/node_modules\/quick-commitlint/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'qdb_converter',
        setupExe: 'QDB-Converter-Setup.exe',
        setupIcon: 'resources/icons/qdb-converter.ico',
      },
    },
    { name: '@electron-forge/maker-zip', platforms: ['win32'] },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: { owner: 'Celtian', name: 'qdb-converter' },
        draft: false,
        prerelease: version.includes('-'),
      },
    },
  ],
};
