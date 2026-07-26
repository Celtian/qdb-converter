import { routes } from './app.routes';

describe('application routes', () => {
  it('exposes imported, converted, conversion, validation, and export flows', () => {
    expect(routes.map((route) => route.path)).toEqual([
      '',
      'convert',
      'import',
      'datasets',
      'validate',
      'export',
      'conversions',
      'settings',
      '**',
    ]);
  });

  it('redirects legacy conversion history links to converted datasets', () => {
    expect(routes.find((route) => route.path === 'conversions')).toMatchObject({
      redirectTo: '/datasets',
      pathMatch: 'full',
    });
  });
});
