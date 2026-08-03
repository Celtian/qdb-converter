import type { Routes } from '@angular/router';

import { documentationPages } from './documentation';

export const routes: Routes = [
  ...documentationPages.map((page) => ({
    path: page.path,
    loadComponent: () =>
      import('./pages/documentation-page/documentation-page').then(
        (module) => module.DocumentationPage,
      ),
    data: { content: page.content, slug: page.slug },
    title: `${page.title} · QDB Converter`,
  })),
  { path: '**', redirectTo: '' },
];
