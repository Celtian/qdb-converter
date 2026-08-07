import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';

import axe from 'axe-core';

import { AboutDialog } from '../about-dialog/about-dialog';
import { AppNavigation } from './app-navigation';

describe('AppNavigation', () => {
  let component: AppNavigation;
  let fixture: ComponentFixture<AppNavigation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppNavigation],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppNavigation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens application information', () => {
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open');
    (component as unknown as { openAbout(): void }).openAbout();
    expect(open).toHaveBeenCalledWith(AboutDialog, {
      width: '700px',
      maxWidth: 'calc(100vw - 2rem)',
      autoFocus: 'dialog',
    });
  });

  it('exposes Material navigation actions through component harnesses', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const actions = await loader.getAllHarnesses(MatButtonHarness);
    expect(actions.length).toBeGreaterThanOrEqual(6);
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/import"]')).toBeTruthy();
  });

  it('groups navigation links by workflow', () => {
    const nav = (fixture.nativeElement as HTMLElement).querySelector('nav');
    const groups = Array.from(nav?.querySelectorAll<HTMLElement>('[role="group"]') ?? []);

    expect(
      groups.map((group) => group.querySelector('span[id^="nav-group-"]')?.textContent?.trim()),
    ).toEqual(['Imports', 'Conversion', 'Dataset Tools']);
    expect(
      groups.map((group) =>
        Array.from(group.querySelectorAll<HTMLAnchorElement>('a')).map((link) => ({
          label: link.textContent?.trim(),
          path: link.getAttribute('href'),
        })),
      ),
    ).toEqual([
      [
        { label: 'upload_fileImport', path: '/import' },
        { label: 'storageDatasets', path: '/' },
      ],
      [
        { label: 'transformConvert', path: '/convert' },
        { label: 'storageDatasets', path: '/datasets' },
      ],
      [
        { label: 'fact_checkValidate', path: '/validate' },
        { label: 'badgePlayernames', path: '/playernames' },
        { label: 'drive_file_moveExport', path: '/export' },
      ],
    ]);
    expect(groups.map((group) => group.getAttribute('aria-labelledby'))).toEqual([
      'nav-group-data',
      'nav-group-conversion',
      'nav-group-dataset-tools',
    ]);
  });

  it('has no automatically detectable accessibility violations', async () => {
    const result = await axe.run(fixture.nativeElement as HTMLElement);
    expect(result.violations).toEqual([]);
  });
});
