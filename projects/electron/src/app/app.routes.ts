import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Datasets · QDB Converter',
    loadComponent: () => import('./features/datasets/datasets').then((module) => module.Datasets),
  },
  {
    path: 'convert',
    title: 'Convert · QDB Converter',
    loadComponent: () => import('./features/convert/convert').then((module) => module.Convert),
  },
  {
    path: 'conversions',
    title: 'Conversions · QDB Converter',
    loadComponent: () =>
      import('./features/conversions/conversions').then((module) => module.Conversions),
  },
  {
    path: 'settings',
    title: 'Settings · QDB Converter',
    loadComponent: () => import('./features/settings/settings').then((module) => module.Settings),
  },
  { path: '**', redirectTo: '' },
];
