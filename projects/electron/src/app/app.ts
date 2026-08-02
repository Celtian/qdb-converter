import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';

import { NgxAppVersionDirective } from 'ngx-app-version';
import { map } from 'rxjs';

import { AppNavigation } from './core/app-navigation/app-navigation';
import { AppStore } from './core/app-store';

@Component({
  selector: 'app-root',
  imports: [
    AppNavigation,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  hostDirectives: [NgxAppVersionDirective],
})
export class App {
  private readonly store = inject(AppStore);
  private readonly breakpoints = inject(BreakpointObserver);
  protected readonly compact = toSignal(
    this.breakpoints.observe('(max-width: 800px)').pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  constructor() {
    void this.store.refresh();
  }
}
