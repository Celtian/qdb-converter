import { RenderMode } from '@angular/ssr';

import { VERSION_INFO } from '../../../version-info';
import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';
import { documentationPages } from './documentation';
import { DocumentationPage } from './pages/documentation-page/documentation-page';
import { siteMetadata } from './site-metadata';

describe('documentation configuration', () => {
  const publicRoutes = routes.filter((route) => route.path !== '**');
  const paths = [
    '',
    'features',
    'download',
    'importing',
    'managing-datasets',
    'converting',
    'validation-and-export',
    'settings',
    'development',
    'releases',
  ];

  it('keeps routes, navigation, and titles in the documented order', () => {
    expect(documentationPages.map((page) => page.path)).toEqual(paths);
    expect(publicRoutes.map((route) => route.path)).toEqual(paths);
    expect(publicRoutes.map((route) => route.title)).toEqual([
      'Documentation · QDB Converter',
      'Features · QDB Converter',
      'Download and installation · QDB Converter',
      'Importing · QDB Converter',
      'Managing datasets · QDB Converter',
      'Converting · QDB Converter',
      'Dataset tools · QDB Converter',
      'Settings · QDB Converter',
      'Development · QDB Converter',
      'Releases · QDB Converter',
    ]);
    expect(routes.at(-1)).toMatchObject({ path: '**', redirectTo: '' });
  });

  it('lazy-loads the shared documentation page for every public route', async () => {
    for (const route of publicRoutes) {
      expect(await route.loadComponent?.()).toBe(DocumentationPage);
    }
  });

  it('provides structured content and a unique slug for every page', () => {
    const slugs = new Set<string>();

    for (const page of documentationPages) {
      expect(page.content).toMatchObject({
        eyebrow: expect.any(String),
        title: expect.any(String),
        summary: expect.any(String),
        sections: expect.any(Array),
      });
      expect(page.content.sections.length).toBeGreaterThan(0);
      expect(slugs.has(page.slug)).toBe(false);
      slugs.add(page.slug);
    }
  });

  it('keeps every documentation action valid and internal route routable', () => {
    const knownPaths = new Set(paths.map((path) => `/${path}`));
    const actions = documentationPages.flatMap((page) => [
      ...(page.content.actions ?? []),
      ...page.content.sections.flatMap((section) => section.actions ?? []),
    ]);

    for (const action of actions) {
      expect(Boolean(action.href) || Boolean(action.route)).toBe(true);
      expect(Boolean(action.href) && Boolean(action.route)).toBe(false);
      if (action.href) expect(action.href).toMatch(/^https:\/\//);
      if (action.route) expect(knownPaths.has(action.route)).toBe(true);
    }
  });

  it('covers the required workflows and safety boundaries', () => {
    const content = JSON.stringify(documentationPages);

    for (const requiredText of [
      'FIFA 11–23',
      'UTF-16LE',
      't3db',
      'metadata XML',
      'target schema',
      'overall ratings',
      'unique',
      'original source',
      'out-of-range',
      'Imported and Converted tabs',
      'QDB-Converter-Setup.exe',
      'SHA-256',
      'gh-pages',
    ]) {
      expect(content).toContain(requiredText);
    }
  });

  it('prerenders every route', () => {
    expect(serverRoutes).toEqual([{ path: '**', renderMode: RenderMode.Prerender }]);
  });

  it('derives immutable project links from generated version metadata', () => {
    const repository = 'https://github.com/Celtian/qdb-converter';

    expect(siteMetadata).toEqual({
      version: VERSION_INFO.version,
      versionLabel: `v${VERSION_INFO.version}`,
      author: VERSION_INFO.author.name,
      copyrightYear: new Date(VERSION_INFO.date).getUTCFullYear(),
      links: {
        repository,
        version: `${repository}/tree/v${VERSION_INFO.version}`,
        latestRelease: `${repository}/releases/latest`,
        releases: `${repository}/releases`,
        changelog: `${repository}/blob/master/CHANGELOG.md`,
        license: `${repository}/blob/master/LICENSE.md`,
        issues: `${repository}/issues`,
      },
    });
  });
});
