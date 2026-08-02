import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { provideAppVersion } from 'ngx-app-version';

import { VERSION_INFO } from '../../../version-info';
import { routes } from './app.routes';
import { uiPaginatorIntlFactory } from './shared/ui-paginator';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideRouter(routes),
    provideAppVersion({ version: VERSION_INFO.version }),
    { provide: MatPaginatorIntl, useFactory: uiPaginatorIntlFactory },
  ],
};
