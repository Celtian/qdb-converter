import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Imported datasets · QDB Converter',
    loadComponent: () =>
      import('./features/datasets/datasets').then((module) => module.ImportedDatasets),
  },
  {
    path: 'convert',
    title: 'Convert · QDB Converter',
    loadComponent: () => import('./features/convert/convert').then((module) => module.Convert),
  },
  {
    path: 'import',
    title: 'Import · QDB Converter',
    loadComponent: () =>
      import('./features/import-datasets/import-datasets').then((module) => module.ImportDatasets),
  },
  {
    path: 'datasets',
    title: 'Datasets · QDB Converter',
    loadComponent: () =>
      import('./features/converted-datasets/converted-datasets').then(
        (module) => module.ConvertedDatasets,
      ),
  },
  {
    path: 'validate',
    title: 'Validate · QDB Converter',
    loadComponent: () =>
      import('./features/validate-dataset/validate-dataset').then(
        (module) => module.ValidateDataset,
      ),
  },
  {
    path: 'playernames',
    title: 'Playernames · QDB Converter',
    loadComponent: () =>
      import('./features/playernames/playernames').then((module) => module.Playernames),
  },
  {
    path: 'export',
    title: 'Export · QDB Converter',
    loadComponent: () =>
      import('./features/export-dataset/export-dataset').then((module) => module.ExportDataset),
  },
  { path: 'conversions', redirectTo: '/datasets', pathMatch: 'full' },
  {
    path: 'settings',
    title: 'Settings · QDB Converter',
    loadComponent: () => import('./features/settings/settings').then((module) => module.Settings),
  },
  { path: '**', redirectTo: '' },
];
