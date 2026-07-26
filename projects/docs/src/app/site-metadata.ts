import { VERSION_INFO } from '../../../version-info';

const repository = 'https://github.com/Celtian/qdb-converter';
const version = VERSION_INFO.version;

export const siteMetadata = {
  version,
  versionLabel: `v${version}`,
  author: VERSION_INFO.author.name,
  copyrightYear: new Date(VERSION_INFO.date).getUTCFullYear(),
  links: {
    repository,
    version: `${repository}/tree/v${version}`,
    latestRelease: `${repository}/releases/latest`,
    releases: `${repository}/releases`,
    changelog: `${repository}/blob/master/CHANGELOG.md`,
    license: `${repository}/blob/master/LICENSE.md`,
    issues: `${repository}/issues`,
  },
} as const;
