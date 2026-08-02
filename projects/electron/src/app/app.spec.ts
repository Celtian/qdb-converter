import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import axe from 'axe-core';
import { provideAppVersion } from 'ngx-app-version';

import { VERSION_INFO } from '../../../version-info';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideAppVersion({ version: VERSION_INFO.version })],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the application navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('QDB Converter');
  });

  it('exposes the generated version on the root element', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(fixture.nativeElement.getAttribute('app-version')).toBe(VERSION_INFO.version);
  });

  it('has no automatically detectable accessibility violations', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const result = await axe.run(fixture.nativeElement as HTMLElement);
    expect(result.violations).toEqual([]);
  });
});
