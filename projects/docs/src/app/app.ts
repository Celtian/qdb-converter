import { BreakpointObserver } from '@angular/cdk/layout';
import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { NgxAppVersionDirective } from 'ngx-app-version';
import { map } from 'rxjs';

import { documentationPages } from './documentation';
import { siteMetadata } from './site-metadata';

@Component({
  selector: 'app-root',
  imports: [
    NgOptimizedImage,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  hostDirectives: [NgxAppVersionDirective],
})
export class App {
  private readonly breakpoint = inject(BreakpointObserver);
  protected readonly pages = documentationPages;
  protected readonly site = siteMetadata;
  protected readonly compactNavigation = toSignal(
    this.breakpoint.observe('(max-width: 900px)').pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly mobileNavigationOpen = signal(false);
  protected readonly navigationMode = computed(() =>
    this.compactNavigation() ? ('over' as const) : ('side' as const),
  );
  protected readonly navigationOpened = computed(
    () => !this.compactNavigation() || this.mobileNavigationOpen(),
  );

  protected toggleNavigation(): void {
    this.mobileNavigationOpen.update((opened) => !opened);
  }

  protected closeNavigation(): void {
    if (this.compactNavigation()) this.mobileNavigationOpen.set(false);
  }

  protected navigationChanged(opened: boolean): void {
    if (this.compactNavigation() && !opened) this.mobileNavigationOpen.set(false);
  }
}
