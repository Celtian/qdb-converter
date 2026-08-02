import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import axe from 'axe-core';
import { provideAppVersion } from 'ngx-app-version';
import { of } from 'rxjs';

import { VERSION_INFO } from '../../../version-info';
import { App } from './app';
import { documentationPages } from './documentation';
import { siteMetadata } from './site-metadata';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideAppVersion({ version: VERSION_INFO.version }),
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: true }) },
        },
      ],
    }).compileComponents();
  });

  it('renders the Converter brand, icon, and complete documentation navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const links = [...page.querySelectorAll<HTMLElement>('mat-nav-list a')];

    expect(page.querySelector('.brand')?.textContent).toContain('QDB Converter');
    expect(
      page.querySelector<HTMLImageElement>('.brand img')?.getAttribute('ng-img'),
    ).not.toBeNull();
    expect(links.map((link) => link.querySelector('span')?.textContent.trim())).toEqual(
      documentationPages.map((documentationPage) => documentationPage.label),
    );
  });

  it('toggles responsive documentation navigation from its trigger', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const trigger = page.querySelector<HTMLButtonElement>('.navigation-trigger')!;
    const navigation = fixture.componentInstance as unknown as {
      closeNavigation(): void;
      navigationChanged(opened: boolean): void;
    };

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.click();
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    navigation.closeNavigation();
    navigation.navigationChanged(false);
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders generated version metadata and safe external project links', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const externalLinks = [...page.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')];

    expect(fixture.nativeElement.getAttribute('app-version')).toBe(VERSION_INFO.version);
    expect(page.querySelector('footer')?.textContent).toContain(siteMetadata.versionLabel);
    expect(page.querySelector('footer')?.textContent).toContain(String(siteMetadata.copyrightYear));
    expect(externalLinks.length).toBeGreaterThan(0);
    for (const link of externalLinks) {
      expect(link.rel).toBe('noopener noreferrer');
      expect(link.getAttribute('aria-label')).toContain('opens in a new tab');
    }
  });

  it('has no detectable AXE accessibility violations', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const results = await axe.run(fixture.nativeElement as HTMLElement);
    expect(results.violations).toEqual([]);
  });
});
